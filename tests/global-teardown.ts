import { cleanupDatabase } from "./utils/db-cleanup";

/**
 * Global teardown runs once after all tests have completed.
 * This is the perfect place to clean up the test database.
 */
async function globalTeardown() {
  console.log("\n=== Running global teardown ===");

  try {
    await cleanupDatabase();
  } catch (error) {
    console.error("Failed to cleanup database:", error);
    // Don't throw error to prevent test failures due to cleanup issues
    // But log it so we know something went wrong
  }

  console.log("=== Global teardown completed ===\n");
}

export default globalTeardown;
