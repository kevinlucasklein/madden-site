import * as dotenv from 'dotenv';
import * as childProcess from 'node:child_process';

dotenv.config();

try {
  // Terminate active connections to the target database
  childProcess.execSync(
    `psql -U ${process.env.PGUSER} -d postgres -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${process.env.PGDATABASE}' AND pid <> pg_backend_pid();"`
  );

  // Drop the database after connections are terminated
  childProcess.execSync(
    `psql -U ${process.env.PGUSER} -d postgres -c "DROP DATABASE ${process.env.PGDATABASE};"`,
    { stdio: 'inherit', env: { ...process.env, PGPASSWORD: process.env.PGPASSWORD } }
  );

  console.log(`Database '${process.env.PGDATABASE}' has been deleted successfully.`);
} catch (error) {
  if (error instanceof Error) {
    console.log(`An error occurred while deleting the database '${process.env.PGDATABASE}':`, error.message);
  } else {
    console.log(`An unexpected error occurred while deleting the database '${process.env.PGDATABASE}'.`);
  }
}
