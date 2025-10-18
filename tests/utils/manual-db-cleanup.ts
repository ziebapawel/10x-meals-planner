#!/usr/bin/env node

/**
 * Manual Database Cleanup Script
 *
 * This script can be run manually to clean up the test database.
 * Usage: npx tsx tests/utils/manual-db-cleanup.ts
 */

import { cleanupDatabase } from "./db-cleanup";

async function main() {
  console.log("╔════════════════════════════════════════════╗");
  console.log("║  Manual Database Cleanup for E2E Tests    ║");
  console.log("╚════════════════════════════════════════════╝\n");

  try {
    await cleanupDatabase();
    console.log("\n✅ Database cleanup completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Database cleanup failed!");
    console.error(error);
    process.exit(1);
  }
}

main();
