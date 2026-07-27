import Redis from 'ioredis';

let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return client;
}

export async function connectRedis(url?: string): Promise<Redis> {
  const redisUrl = url || process.env.REDIS_URL || 'redis://localhost:6379';
  if (client) return client;

  client = new Redis(redisUrl, { maxRetriesPerRequest: 3 });
  const pong = await client.ping();
  if (pong !== 'PONG') {
    throw new Error('Redis ping failed');
  }
  console.log('[redis] connected');
  return client;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = await getRedis().get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  await getRedis().set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

export async function cacheDel(...keys: string[]): Promise<void> {
  if (keys.length) await getRedis().del(...keys);
}

export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}
