import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

declare global {
  var __db: Database.Database | undefined;
}

// Ensure data directory exists
const dataDir = process.env.SQLITE_DATA_DIR || '/app/data';
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DATABASE_URL?.replace('sqlite:', '') || join(dataDir, 'jobsearch.db');

const db = globalThis.__db ?? new Database(dbPath, {
  verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__db = db;
}

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = 1000000');
db.pragma('foreign_keys = ON');
db.pragma('temp_store = MEMORY');

export { db };

// Test connection
export async function testConnection() {
  try {
    const result = db.prepare('SELECT datetime("now") as now').get();
    console.log('✅ SQLite database connected successfully');
    console.log(`📁 Database location: ${dbPath}`);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
process.on('exit', () => {
  if (db) {
    db.close();
  }
});

process.on('SIGINT', () => {
  if (db) {
    db.close();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (db) {
    db.close();
  }
  process.exit(0);
});
