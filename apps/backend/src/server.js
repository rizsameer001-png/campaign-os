import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

app.listen(env.PORT, () => {
  logger.info(`Backend listening on port ${env.PORT}`, { env: env.NODE_ENV });
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: String(reason) });
});
