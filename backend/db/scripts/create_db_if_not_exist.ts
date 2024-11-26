import * as dotenv from 'dotenv';
import * as childProcess from 'node:child_process';

dotenv.config();

try {
  console.log(`Creating database '${process.env.PGDATABASE}' if it does not exist...`);
  childProcess.execSync(
    `psql -U ${process.env.PGUSER} -d postgres -c "CREATE DATABASE ${process.env.PGDATABASE};"`,
    { stdio: 'inherit', env: { ...process.env, PGPASSWORD: process.env.PGPASSWORD } }
  );
  console.log(`Database '${process.env.PGDATABASE}' created successfully.`);
} catch (error) {
  console.log(`Database '${process.env.PGDATABASE}' might already exist, skipping creation.`);
}
