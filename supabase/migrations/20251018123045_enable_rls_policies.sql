-- migration: enable_rls_policies
-- description: re-enables row level security (rls) for all tables with granular policies
--              for all crud operations. includes separate policies for authenticated and
--              anonymous users following supabase best practices.
-- created_at: 2025-10-18 12:30:45 UTC
-- affected tables: meal_plans, meals, shopping_lists
-- special considerations:
--   - anonymous users have no access to any data (all policies return false)
--   - authenticated users can only access their own data
--   - meals and shopping_lists access is controlled via meal_plans ownership

-- ============================================================================
-- table: meal_plans
-- description: re-enable rls and create granular policies for meal_plans table
-- ============================================================================

-- enable row level security on meal_plans table
-- this ensures that all access must go through defined policies
alter table meal_plans enable row level security;

-- policy: allow authenticated users to select their own meal plans
-- rationale: users should only see meal plans they created
-- operation: select
-- role: authenticated
create policy "meal_plans_select_authenticated" on meal_plans
for select to authenticated using (auth.uid() = user_id);

-- policy: deny anonymous users from selecting meal plans
-- rationale: unauthenticated users should not have access to any meal plans
-- operation: select
-- role: anon
create policy "meal_plans_select_anon" on meal_plans
for select to anon using (false);

-- policy: allow authenticated users to insert their own meal plans
-- rationale: authenticated users can create new meal plans for themselves
-- operation: insert
-- role: authenticated
create policy "meal_plans_insert_authenticated" on meal_plans
for insert to authenticated with check (auth.uid() = user_id);

-- policy: deny anonymous users from inserting meal plans
-- rationale: unauthenticated users cannot create meal plans
-- operation: insert
-- role: anon
create policy "meal_plans_insert_anon" on meal_plans
for insert to anon with check (false);

-- policy: allow authenticated users to update their own meal plans
-- rationale: users can modify only their own meal plans
-- operation: update
-- role: authenticated
create policy "meal_plans_update_authenticated" on meal_plans
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- policy: deny anonymous users from updating meal plans
-- rationale: unauthenticated users cannot modify meal plans
-- operation: update
-- role: anon
create policy "meal_plans_update_anon" on meal_plans
for update to anon
using (false)
with check (false);

-- policy: allow authenticated users to delete their own meal plans
-- rationale: users can delete only their own meal plans
-- operation: delete
-- role: authenticated
-- note: cascading deletes will automatically remove associated meals and shopping lists
create policy "meal_plans_delete_authenticated" on meal_plans
for delete to authenticated using (auth.uid() = user_id);

-- policy: deny anonymous users from deleting meal plans
-- rationale: unauthenticated users cannot delete meal plans
-- operation: delete
-- role: anon
create policy "meal_plans_delete_anon" on meal_plans
for delete to anon using (false);

-- ============================================================================
-- table: meals
-- description: re-enable rls and create granular policies for meals table
-- ============================================================================

-- enable row level security on meals table
-- this ensures that all access must go through defined policies
alter table meals enable row level security;

-- policy: allow authenticated users to select meals from their own plans
-- rationale: users can view meals only from meal plans they own
-- operation: select
-- role: authenticated
-- note: uses exists subquery to check meal_plans ownership
create policy "meals_select_authenticated" on meals
for select to authenticated using (
    exists (
        select 1
        from meal_plans
        where meal_plans.id = meals.plan_id
        and meal_plans.user_id = auth.uid()
    )
);

-- policy: deny anonymous users from selecting meals
-- rationale: unauthenticated users should not have access to any meals
-- operation: select
-- role: anon
create policy "meals_select_anon" on meals
for select to anon using (false);

-- policy: allow authenticated users to insert meals for their own plans
-- rationale: users can add meals only to meal plans they own
-- operation: insert
-- role: authenticated
-- note: validates ownership before allowing insert
create policy "meals_insert_authenticated" on meals
for insert to authenticated with check (
    exists (
        select 1
        from meal_plans
        where meal_plans.id = meals.plan_id
        and meal_plans.user_id = auth.uid()
    )
);

-- policy: deny anonymous users from inserting meals
-- rationale: unauthenticated users cannot create meals
-- operation: insert
-- role: anon
create policy "meals_insert_anon" on meals
for insert to anon with check (false);

-- policy: allow authenticated users to update meals in their own plans
-- rationale: users can modify meals only in meal plans they own
-- operation: update
-- role: authenticated
-- note: both using and with check clauses ensure ownership
create policy "meals_update_authenticated" on meals
for update to authenticated
using (
    exists (
        select 1
        from meal_plans
        where meal_plans.id = meals.plan_id
        and meal_plans.user_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from meal_plans
        where meal_plans.id = meals.plan_id
        and meal_plans.user_id = auth.uid()
    )
);

-- policy: deny anonymous users from updating meals
-- rationale: unauthenticated users cannot modify meals
-- operation: update
-- role: anon
create policy "meals_update_anon" on meals
for update to anon
using (false)
with check (false);

-- policy: allow authenticated users to delete meals from their own plans
-- rationale: users can remove meals only from meal plans they own
-- operation: delete
-- role: authenticated
create policy "meals_delete_authenticated" on meals
for delete to authenticated using (
    exists (
        select 1
        from meal_plans
        where meal_plans.id = meals.plan_id
        and meal_plans.user_id = auth.uid()
    )
);

-- policy: deny anonymous users from deleting meals
-- rationale: unauthenticated users cannot delete meals
-- operation: delete
-- role: anon
create policy "meals_delete_anon" on meals
for delete to anon using (false);

-- ============================================================================
-- table: shopping_lists
-- description: re-enable rls and create granular policies for shopping_lists table
-- ============================================================================

-- enable row level security on shopping_lists table
-- this ensures that all access must go through defined policies
alter table shopping_lists enable row level security;

-- policy: allow authenticated users to select their own shopping lists
-- rationale: users can view shopping lists only from meal plans they own
-- operation: select
-- role: authenticated
-- note: uses exists subquery to check meal_plans ownership
create policy "shopping_lists_select_authenticated" on shopping_lists
for select to authenticated using (
    exists (
        select 1
        from meal_plans
        where meal_plans.id = shopping_lists.plan_id
        and meal_plans.user_id = auth.uid()
    )
);

-- policy: deny anonymous users from selecting shopping lists
-- rationale: unauthenticated users should not have access to any shopping lists
-- operation: select
-- role: anon
create policy "shopping_lists_select_anon" on shopping_lists
for select to anon using (false);

-- policy: allow authenticated users to create shopping lists for their own plans
-- rationale: users can create shopping lists only for meal plans they own
-- operation: insert
-- role: authenticated
-- note: validates ownership before allowing insert
create policy "shopping_lists_insert_authenticated" on shopping_lists
for insert to authenticated with check (
    exists (
        select 1
        from meal_plans
        where meal_plans.id = shopping_lists.plan_id
        and meal_plans.user_id = auth.uid()
    )
);

-- policy: deny anonymous users from inserting shopping lists
-- rationale: unauthenticated users cannot create shopping lists
-- operation: insert
-- role: anon
create policy "shopping_lists_insert_anon" on shopping_lists
for insert to anon with check (false);

-- policy: allow authenticated users to update their own shopping lists
-- rationale: users can modify shopping lists only for meal plans they own
-- operation: update
-- role: authenticated
-- note: both using and with check clauses ensure ownership
create policy "shopping_lists_update_authenticated" on shopping_lists
for update to authenticated
using (
    exists (
        select 1
        from meal_plans
        where meal_plans.id = shopping_lists.plan_id
        and meal_plans.user_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from meal_plans
        where meal_plans.id = shopping_lists.plan_id
        and meal_plans.user_id = auth.uid()
    )
);

-- policy: deny anonymous users from updating shopping lists
-- rationale: unauthenticated users cannot modify shopping lists
-- operation: update
-- role: anon
create policy "shopping_lists_update_anon" on shopping_lists
for update to anon
using (false)
with check (false);

-- policy: allow authenticated users to delete their own shopping lists
-- rationale: users can delete shopping lists only from meal plans they own
-- operation: delete
-- role: authenticated
create policy "shopping_lists_delete_authenticated" on shopping_lists
for delete to authenticated using (
    exists (
        select 1
        from meal_plans
        where meal_plans.id = shopping_lists.plan_id
        and meal_plans.user_id = auth.uid()
    )
);

-- policy: deny anonymous users from deleting shopping lists
-- rationale: unauthenticated users cannot delete shopping lists
-- operation: delete
-- role: anon
create policy "shopping_lists_delete_anon" on shopping_lists
for delete to anon using (false);
