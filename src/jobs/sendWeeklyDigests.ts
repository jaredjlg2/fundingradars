import { generateWeeklyDigests } from '../services/digestService';
import { logger } from '../lib/logging';

async function main() {
  logger.info('Starting weekly digest job');
  try {
    const result = await generateWeeklyDigests();
    logger.info('Digest job completed', result);
    process.exit(0);
  } catch (err) {
    logger.error('Digest job failed', { error: err instanceof Error ? err.message : String(err) });
    process.exit(1);
  }
}

main();
