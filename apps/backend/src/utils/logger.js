// Minimal structured logger. Swap for pino/winston later without touching
// call sites — every module imports `logger`, never console directly.
const timestamp = () => new Date().toISOString();

export const logger = {
  info: (msg, meta = {}) => console.log(JSON.stringify({ level: 'info', ts: timestamp(), msg, ...meta })),
  warn: (msg, meta = {}) => console.warn(JSON.stringify({ level: 'warn', ts: timestamp(), msg, ...meta })),
  error: (msg, meta = {}) => console.error(JSON.stringify({ level: 'error', ts: timestamp(), msg, ...meta })),
};
