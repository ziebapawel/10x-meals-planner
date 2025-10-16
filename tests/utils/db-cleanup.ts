import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/db/database.types';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

/**
 * Cleans up the Supabase database by deleting all entries from test tables.
 * This should be run after all e2e tests to ensure a clean state.
 */
export async function cleanupDatabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const testUserId = process.env.E2E_USERNAME_ID;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase credentials in .env.test');
  }

  if (!testUserId) {
    throw new Error('Missing E2E_USERNAME_ID in .env.test');
  }

  // Create Supabase client
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

  console.log('Starting database cleanup...');

  try {
    // First, get all meal_plan IDs for the test user
    const { data: mealPlans, error: fetchError } = await supabase
      .from('meal_plans')
      .select('id')
      .eq('user_id', testUserId);

    if (fetchError) {
      console.error('Error fetching meal plans:', fetchError);
      throw fetchError;
    }

    if (!mealPlans || mealPlans.length === 0) {
      console.log('No meal plans found for test user. Database is already clean.');
      return;
    }

    const planIds = mealPlans.map(plan => plan.id);
    console.log(`Found ${planIds.length} meal plan(s) to clean up`);

    // Delete in correct order due to foreign key constraints
    // 1. Delete meals (references meal_plans)
    const { error: mealsError, count: mealsCount } = await supabase
      .from('meals')
      .delete({ count: 'exact' })
      .in('plan_id', planIds);

    if (mealsError) {
      console.error('Error deleting meals:', mealsError);
      throw mealsError;
    }
    console.log(`Deleted ${mealsCount ?? 0} meal(s)`);

    // 2. Delete shopping_lists (references meal_plans)
    const { error: shoppingListsError, count: shoppingListsCount } = await supabase
      .from('shopping_lists')
      .delete({ count: 'exact' })
      .in('plan_id', planIds);

    if (shoppingListsError) {
      console.error('Error deleting shopping_lists:', shoppingListsError);
      throw shoppingListsError;
    }
    console.log(`Deleted ${shoppingListsCount ?? 0} shopping list(s)`);

    // 3. Delete meal_plans (parent table)
    const { error: mealPlansError, count: mealPlansCount } = await supabase
      .from('meal_plans')
      .delete({ count: 'exact' })
      .eq('user_id', testUserId);

    if (mealPlansError) {
      console.error('Error deleting meal_plans:', mealPlansError);
      throw mealPlansError;
    }
    console.log(`Deleted ${mealPlansCount ?? 0} meal plan(s)`);

    console.log('Database cleanup completed successfully');
  } catch (error) {
    console.error('Database cleanup failed:', error);
    throw error;
  }
}
