/**
 * Migration Runner - Manages database migrations
 * 
 * This utility handles the execution of database migrations in sequence,
 * tracking which migrations have been applied and managing errors.
 */

import * as migration001 from './migrations/001_add_ocr_fields.js';

/**
 * List of all available migrations
 * Migrations are executed in order
 */
const MIGRATIONS = [
  {
    id: '001',
    name: 'add_ocr_fields',
    module: migration001,
  },
  // Future migrations can be added here
  // {
  //   id: '002',
  //   name: 'add_new_feature',
  //   module: migration002,
  // },
];

/**
 * Initialize the migrations table to track applied migrations
 * @param {Object} db - SQLite database instance
 * @returns {Promise<void>}
 */
const initMigrationsTable = async (db) => {
  try {
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS migrations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        version TEXT
      )
    `);
    console.log('Migrations table initialized');
  } catch (error) {
    console.error('Error initializing migrations table:', error);
    throw error;
  }
};

/**
 * Check if a migration has been applied
 * @param {Object} db - SQLite database instance
 * @param {string} migrationId - ID of the migration
 * @returns {Promise<boolean>} - True if migration has been applied
 */
const isMigrationApplied = async (db, migrationId) => {
  try {
    const result = await db.executeSql(
      'SELECT id FROM migrations WHERE id = ?',
      [migrationId]
    );
    return result[0] && result[0].rows.length > 0;
  } catch (error) {
    // If table doesn't exist, migration hasn't been applied
    return false;
  }
};

/**
 * Record that a migration has been applied
 * @param {Object} db - SQLite database instance
 * @param {string} migrationId - ID of the migration
 * @param {string} migrationName - Name of the migration
 * @param {string} version - Version of the migration
 * @returns {Promise<void>}
 */
const recordMigration = async (db, migrationId, migrationName, version) => {
  try {
    await db.executeSql(
      'INSERT OR IGNORE INTO migrations (id, name, version) VALUES (?, ?, ?)',
      [migrationId, migrationName, version]
    );
    console.log(`Recorded migration ${migrationId} in migrations table`);
  } catch (error) {
    console.error(`Error recording migration ${migrationId}:`, error);
    throw error;
  }
};

/**
 * Run all pending migrations
 * @param {Object} db - SQLite database instance
 * @returns {Promise<Object>} - Results of migration execution
 */
export const runMigrations = async (db) => {
  console.log('Starting migration runner');
  
  const results = {
    total: MIGRATIONS.length,
    applied: 0,
    skipped: 0,
    failed: 0,
    migrations: [],
  };

  try {
    // Initialize migrations tracking table
    await initMigrationsTable(db);

    // Execute each migration
    for (const migration of MIGRATIONS) {
      try {
        const alreadyApplied = await isMigrationApplied(db, migration.id);

        if (alreadyApplied) {
          console.log(`Migration ${migration.id} (${migration.name}) already applied, skipping`);
          results.skipped++;
          results.migrations.push({
            id: migration.id,
            name: migration.name,
            status: 'skipped',
            message: 'Already applied',
          });
          continue;
        }

        console.log(`\nApplying migration ${migration.id} (${migration.name})`);
        const migrationInfo = migration.module.getMigrationInfo();
        
        // Execute the migration
        await migration.module.migrate(db);

        // Record the migration
        await recordMigration(db, migration.id, migration.name, migrationInfo.version);

        console.log(`✓ Migration ${migration.id} applied successfully`);
        results.applied++;
        results.migrations.push({
          id: migration.id,
          name: migration.name,
          status: 'applied',
          message: 'Applied successfully',
        });
      } catch (error) {
        console.error(`✗ Migration ${migration.id} failed:`, error);
        results.failed++;
        results.migrations.push({
          id: migration.id,
          name: migration.name,
          status: 'failed',
          error: error.message,
        });

        // Continue with next migration or stop on critical error
        // For now, we continue to allow partial migrations
        console.warn(`Continuing with next migration despite error in ${migration.id}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('Migration Summary:');
    console.log(`  Total: ${results.total}`);
    console.log(`  Applied: ${results.applied}`);
    console.log(`  Skipped: ${results.skipped}`);
    console.log(`  Failed: ${results.failed}`);
    console.log('='.repeat(50));

    return results;
  } catch (error) {
    console.error('Critical error in migration runner:', error);
    throw new Error(`Migration runner failed: ${error.message}`);
  }
};

/**
 * Get migration status
 * @param {Object} db - SQLite database instance
 * @returns {Promise<Array>} - Array of applied migrations
 */
export const getMigrationStatus = async (db) => {
  try {
    const result = await db.executeSql(
      'SELECT id, name, applied_at, version FROM migrations ORDER BY applied_at ASC'
    );

    const migrations = [];
    if (result[0] && result[0].rows) {
      for (let i = 0; i < result[0].rows.length; i++) {
        migrations.push(result[0].rows.item(i));
      }
    }
    return migrations;
  } catch (error) {
    console.error('Error getting migration status:', error);
    return [];
  }
};

export default {
  runMigrations,
  getMigrationStatus,
};
