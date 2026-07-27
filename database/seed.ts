import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');

  const pool = new Pool({ connectionString: url });
  const dir = path.join(__dirname, 'seeds');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    await pool.query(sql);
    console.log(`[seed] applied ${file}`);
  }

  await pool.end();
  console.log('[seed] done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
