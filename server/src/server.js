import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import logger from './utils/logger.js';

const start = async () => {
  await connectDatabase();

  const server = app.listen(env.port, () => {
    logger.success(`Sweet Lava API listening on http://localhost:${env.port} (${env.nodeEnv})`);
    if (!env.paymob.enabled) logger.warn('Paymob is not configured — online card payment is disabled.');
    if (!env.google.enabled) logger.warn('Google OAuth is not configured — Google sign-in is disabled.');
  });

  const shutdown = (signal) => () => {
    logger.info(`${signal} received, shutting down gracefully...`);
    server.close(() => process.exit(0));
    // Force exit if connections refuse to drain.
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', shutdown('SIGTERM'));
  process.on('SIGINT', shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled rejection: ${reason}`);
    server.close(() => process.exit(1));
  });
};

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught exception: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});

start().catch((error) => {
  logger.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});
