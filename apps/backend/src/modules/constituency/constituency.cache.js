import { getRedisClient } from '../../config/redis.js';

const TTL_SECONDS = 60 * 60; // CI-D-007
const keyFor = (name, state) => `constituency:${state}:${name}`.toLowerCase();

export async function getCached(name, state) {
  const client = await getRedisClient().catch(() => null);
  if (!client) return null;
  const cached = await client.get(keyFor(name, state)).catch(() => null);
  return cached ? JSON.parse(cached) : null;
}

export async function setCached(name, state, data) {
  const client = await getRedisClient().catch(() => null);
  if (!client) return;
  await client.set(keyFor(name, state), JSON.stringify(data), { EX: TTL_SECONDS }).catch(() => {});
}

export async function invalidate(name, state) {
  const client = await getRedisClient().catch(() => null);
  if (!client) return;
  await client.del(keyFor(name, state)).catch(() => {});
}
