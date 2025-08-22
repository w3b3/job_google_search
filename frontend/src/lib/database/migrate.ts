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
    
    // Split schema into individual statements and execute
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`📋 Executing ${statements.length} database statements...`);
    
    let createdTables = 0;
    let createdIndexes = 0;
    let createdViews = 0;
    let createdTriggers = 0;
    
    for (const statement of statements) {
      try {
        db.exec(statement + ';');
        
        // Count different types of objects created
        if (statement.toUpperCase().includes('CREATE TABLE')) {
          createdTables++;
          const tableName = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i)?.[1];
          if (tableName) {
            console.log(`  ✓ Table: ${tableName}`);
          }
        } else if (statement.toUpperCase().includes('CREATE INDEX')) {
          createdIndexes++;
        } else if (statement.toUpperCase().includes('CREATE VIEW')) {
          createdViews++;
          const viewName = statement.match(/CREATE VIEW (?:IF NOT EXISTS )?(\w+)/i)?.[1];
          if (viewName) {
            console.log(`  ✓ View: ${viewName}`);
          }
        } else if (statement.toUpperCase().includes('CREATE TRIGGER')) {
          createdTriggers++;
        }
      } catch (error) {
        // Ignore "already exists" errors
        if (!error.message.includes('already exists')) {
          console.error(`❌ Error executing statement: ${statement.substring(0, 100)}...`);
          throw error;
        }
      }
    }
    
    console.log('✅ SQLite database migration completed successfully');
    console.log(`📊 Migration summary:`);
    console.log(`   • Tables: ${createdTables}`);
    console.log(`   • Indexes: ${createdIndexes}`);
    console.log(`   • Views: ${createdViews}`);
    console.log(`   • Triggers: ${createdTriggers}`);
    console.log(`📁 Database location: ${process.env.DATABASE_URL || '/app/data/jobsearch.db'}`);
    
    // Verify saved results tables were created
    await verifySavedResultsTables();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

/**
 * Verify that saved results tables were created successfully
 */
async function verifySavedResultsTables() {
  console.log('🔍 Verifying saved results tables...');
  
  const savedResultsTables = [
    'saved_result_collections',
    'saved_results',
    'saved_result_exports',
    'collection_shares',
    'collection_templates',
    'auto_save_rules'
  ];
  
  const savedResultsViews = [
    'collection_summary',
    'user_dashboard_stats'
  ];
  
  try {
    // Check tables
    for (const tableName of savedResultsTables) {
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
    
    // Check views
    for (const viewName of savedResultsViews) {
      const result = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='view' AND name=?
      `).get(viewName);
      
      if (result) {
        console.log(`  ✓ View verified: ${viewName}`);
      } else {
        console.warn(`  ⚠️  View missing: ${viewName}`);
      }
    }
    
    console.log('✅ Saved results schema verification completed');
    
  } catch (error) {
    console.error('❌ Error verifying saved results tables:', error);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrate();
}

export { migrate };
