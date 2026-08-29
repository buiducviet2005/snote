import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/snote_db?schema=public';
const pool = new Pool({ connectionString });

async function main() {
  const client = await pool.connect();
  try {
    console.log('Connected to PostgreSQL database.');

    // 1. Add google_id column to users table
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
    `);
    console.log('✅ Added google_id column if not exists.');

    // 2. Make password_hash nullable
    await client.query(`
      ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
    `);
    console.log('✅ Made password_hash nullable.');

    const res = await client.query(`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    console.log('Users table columns:');
    res.rows.forEach((r: any) => console.log(` - ${r.column_name}: ${r.data_type} (nullable: ${r.is_nullable})`));
  } finally {
    client.release();
    await pool.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
