import { getEnv } from '@/lib/env';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

type CacheBackend = 'redis' | 'memory';

let backend: CacheBackend = 'memory';
let redisClient: any = null;
const memoryStore = new Map<string, CacheEntry<any>>();

async function getRedisClient() {
  if (redisClient) return redisClient;
  try {
    const { createClient } = await import('redis');
    redisClient = createClient({ url: getEnv().REDIS_URL });
    redisClient.on('error', () => {
      backend = 'memory';
    });
    await redisClient.connect();
    backend = 'redis';
  } catch {
    backend = 'memory';
  }
  return redisClient;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const ttl = getEnv().REDIS_TTL_SECONDS * 1000;

  if (backend === 'redis') {
    try {
      const client = await getRedisClient();
      const raw = await client.get(key);
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() > entry.expiresAt) {
        await client.del(key);
        return null;
      }
      return entry.data;
    } catch {
      backend = 'memory';
    }
  }

  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.data;
}

export async function cacheSet<T>(key: string, data: T): Promise<void> {
  const ttl = getEnv().REDIS_TTL_SECONDS * 1000;
  const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttl };

  if (backend === 'redis') {
    try {
      const client = await getRedisClient();
      await client.set(key, JSON.stringify(entry), { PX: ttl });
      return;
    } catch {
      backend = 'memory';
    }
  }

  memoryStore.set(key, entry);
}

export async function cacheDelete(key: string): Promise<void> {
  if (backend === 'redis') {
    try {
      const client = await getRedisClient();
      await client.del(key);
      return;
    } catch {
      backend = 'memory';
    }
  }
  memoryStore.delete(key);
}
