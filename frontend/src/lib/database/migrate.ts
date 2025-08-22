import { readFileSync } from 'fs';
import { join } from 'path';
import { db, testConnection } from './connection';

async function migrate() {
  console.log('🚀 Starting SQLite database migration...');
  
  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }
  
  try {
    // Read and execute schema
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    
    // Execute the entire schema at once - SQLite can handle multiple statements
    console.log(`📋 Executing database schema...`);
    
    try {
      db.exec(schema);
      console.log('✅ Database schema executed successfully');
      
      // Check what was created
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
      const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'").all();
      const views = db.prepare("SELECT name FROM sqlite_master WHERE type='view'").all();
      const triggers = db.prepare("SELECT name FROM sqlite_master WHERE type='trigger'").all();
      
      console.log(`  ✓ Tables: ${tables.length}`);
      console.log(`  ✓ Indexes: ${indexes.length}`);
      console.log(`  ✓ Views: ${views.length}`);
      console.log(`  ✓ Triggers: ${triggers.length}`);
      
    } catch (error) {
      console.error(`❌ Error executing schema`);
      throw error;
    }
    
    console.log('✅ SQLite database migration completed successfully');
    console.log(`📁 Database location: ${process.env.DATABASE_URL || 'data/jobsearch.db'}`);
    
    // Verify key tables were created
    await verifyKeyTables();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

/**
 * Verify that key tables were created successfully
 */
async function verifyKeyTables() {
  console.log('🔍 Verifying key tables...');
  
  const keyTables = [
    'users',
    'searches', 
    'job_results',
    'user_usage_logs',
    'saved_result_collections',
    'saved_results'
  ];
  
  try {
    // Check tables
    for (const tableName of keyTables) {
      const result = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?
      `).get(tableName);
      
      if (result) {
        console.log(`  ✓ Table verified: ${tableName}`);
      } else {
        console.warn(`  ⚠️  Table missing: ${tableName}`);
      }
    }
    
    console.log('✅ Key tables verification completed');
    
  } catch (error) {
    console.error('❌ Error verifying tables:', error);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrate();
}

export { migrate };