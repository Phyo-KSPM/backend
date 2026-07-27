import { connectDatabase, getPool, query } from '../../../../packages/shared/src/db/pool';
import { connectRedis } from '../../../../packages/shared/src/redis/client';

export { getPool, query };

export async function connectInfra(): Promise<void> {
  await connectDatabase();
  await connectRedis();
}
