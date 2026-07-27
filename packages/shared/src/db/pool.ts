import { Pool, QueryResult, QueryResultRow } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database pool not initialized. Call connectDatabase() first.');
  }
  return pool;
}

export async function connectDatabase(connectionString?: string): Promise<Pool> {
  const url = connectionString || process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required');
  }
  if (pool) return pool;

  pool = new Pool({ connectionString: url });
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('[db] PostgreSQL connected');
  } finally {
    client.release();
  }
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params);
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
