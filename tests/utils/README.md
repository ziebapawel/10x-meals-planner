# Test Utils

Utility scripts and helpers for testing.

## Database Cleanup

### Automatic Cleanup (Recommended)

The database is automatically cleaned up after all e2e tests complete, thanks to the Playwright `globalTeardown` configuration in `playwright.config.ts`.

This ensures that:
- Test data doesn't accumulate over time
- Each test run starts with a clean state
- No manual intervention is needed

### Manual Cleanup

If you need to manually clean up the test database, you can run:

```bash
npx tsx tests/utils/manual-db-cleanup.ts
```

This will:
1. Connect to the Supabase instance specified in `.env.test`
2. Delete all meals for the test user
3. Delete all shopping lists for the test user
4. Delete all meal plans for the test user

### What Gets Cleaned

The cleanup process removes data from these tables (in order):
1. `meals` - Individual meals within meal plans
2. `shopping_lists` - Shopping lists associated with meal plans
3. `meal_plans` - The meal plans themselves

All deletions are scoped to the test user specified by `E2E_USERNAME_ID` in `.env.test`.

### Environment Variables Required

Make sure your `.env.test` file contains:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `E2E_USERNAME_ID` - The UUID of the test user

### Implementation Details

The cleanup follows these steps:
1. Fetch all meal plan IDs for the test user
2. Delete dependent records (meals, shopping_lists) using the plan IDs
3. Delete the parent records (meal_plans)

This order respects foreign key constraints and ensures complete cleanup without errors.
