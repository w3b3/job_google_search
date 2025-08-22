import { readFileSync } from 'fs';
import { join } from 'path';
import { db, testConnection } from './connection';

async function migrate() {
  console.log('🚀 Starting database migration...');
  
  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }
  
  try {
    // Read and execute schema
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    
    await db.query(schema);
    
    console.log('✅ Database migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrate();
}

export { migrate };
