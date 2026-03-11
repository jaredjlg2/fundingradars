import { syncAll } from '../services/syncService';
import { logger } from '../lib/logging';

async function main() {
  logger.info('Starting opportunity sync job');
  try {
    await syncAll();
    logger.info('Sync job completed successfully');
    process.exit(0);
  } catch (err) {
    logger.error('Sync job failed', { error: err instanceof Error ? err.message : String(err) });
    process.exit(1);
  }
}

main();
