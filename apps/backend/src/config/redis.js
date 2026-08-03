import { createClient } from 'redis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let client = null;
let connecting = null;

/**
 * CI-D-007: Redis-backed 1h cache for constituency data. Returns null if
 * REDIS_URL isn't configured — callers must treat null as "no cache
 * available" and fall through to the DB, not as an error.
 */
export async function getRedisClient() {
  if (!env.REDIS_URL) return null;
  if (client) return client;
  if (connecting) return connecting;

  connecting = (async () => {
    const c = createClient({ url: env.REDIS_URL });
    c.on('error', (err) => logger.error('Redis connection error', { error: err.message }));
    await c.connect();
    client = c;
    return c;
  })();

  return connecting;
}
