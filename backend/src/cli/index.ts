import { initDB, runMigrations, pool } from '../core/db';

const args = process.argv.slice(2);
const command = args[0];

async function runCallback() {
  switch (command) {
    case 'migrate':
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  Running Database Migrations');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      // First initialize database
      await initDB();
      console.log('');
      
      // Then run migrations
      await runMigrations();
      
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  ✓ All migrations completed successfully');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      await pool.end();
      process.exit(0);
      break;
    default:
      console.log('Unknown command. Available commands: migrate');
      console.log('\nUsage:');
      console.log('  npm run cli migrate  - Run database migrations');
      process.exit(1);
  }
}

runCallback().catch((error) => {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
});
