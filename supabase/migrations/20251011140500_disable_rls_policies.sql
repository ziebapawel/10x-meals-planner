-- migration: disable_rls_policies
-- description: disables all row level security policies for development purposes.
-- created_at: 2025-10-11 14:05:00 UTC

--
-- drop policies for meal_plans
--
drop policy "allow authenticated users to select their own meal plans" on meal_plans;
drop policy "allow authenticated users to insert meal plans" on meal_plans;
drop policy "allow authenticated users to update their own meal plans" on meal_plans;
drop policy "allow authenticated users to delete their own meal plans" on meal_plans;

--
-- disable row level security on meal_plans
--
alter table meal_plans disable row level security;

--
-- drop policies for meals
--
drop policy "allow authenticated users to select meals from their own plans" on meals;
drop policy "allow authenticated users to insert meals for their own plans" on meals;
drop policy "allow authenticated users to update meals in their own plans" on meals;
drop policy "allow authenticated users to delete meals from their own plans" on meals;

--
-- disable row level security on meals
--
alter table meals disable row level security;

--
-- drop policies for shopping_lists
--
drop policy "allow authenticated users to see their own shopping lists" on shopping_lists;
drop policy "allow authenticated users to create shopping lists for their own plans" on shopping_lists;
drop policy "allow authenticated users to update their own shopping lists" on shopping_lists;
drop policy "allow authenticated users to delete their own shopping lists" on shopping_lists;

--
-- disable row level security on shopping_lists
--
alter table shopping_lists disable row level security;
