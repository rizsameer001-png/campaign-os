import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

// Avoid exhausting the connection pool with hot-reload in dev (node --watch
// re-imports modules, which would otherwise instantiate a new PrismaClient
// on every file change).
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma;
}
