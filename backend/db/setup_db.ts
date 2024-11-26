import * as dotenv from 'dotenv';
import { execSync } from 'child_process';

dotenv.config();

execSync(
  `psql -U ${process.env.PGUSER} -d ${process.env.PGDATABASE} -f db/database_schema.sql`,
  { stdio: 'inherit', env: { ...process.env, PGPASSWORD: process.env.PGPASSWORD } }
);
