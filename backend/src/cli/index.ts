import { initDB, pool } from '../core/db';

const args = process.argv.slice(2);
const command = args[0];

async function runCallback() {
  switch (command) {
    case 'migrate':
      console.log('Running migrations...');
      await initDB();
      console.log('Migrations completed.');
      await pool.end();
      process.exit(0);
      break;
    default:
      console.log('Unknown command. Available commands: migrate');
      process.exit(1);
  }
}

runCallback().catch((error) => {
  console.error(error);
  process.exit(1);
});
