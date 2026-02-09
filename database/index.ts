/**
 * SmartStore Database Exports
 * Central export point for all database functionality
 */

// Database connection and initialization
export {
    closeDatabase, getDatabase,
    initializeDatabase, toSQLiteDateTime, withTransaction
} from "./database";

// Schema definitions
export { SCHEMA_SQL, SCHEMA_VERSION, TABLES, type TableName } from "./schema";

// Migrations
export {
    getMigrations,
    validateMigrations,
    type Migration
} from "./migrations";

