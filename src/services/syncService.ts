import { prisma } from '@/lib/db';
import * as samProvider from '@/providers/sam';
import * as grantsProvider from '@/providers/grants';
import { upsertOpportunity, markStaleOpportunitiesInactive } from './opportunityService';
import { logger } from '@/lib/logging';

export async function syncSAMOpportunities(): Promise<void> {
  const startedAt = new Date();
  const syncRun = await prisma.syncRun.create({
    data: {
      sourceType: 'SAM',
      jobType: 'sync',
      status: 'running',
      startedAt,
    },
  });

  let recordsFetched = 0;
  let recordsInserted = 0;
  let recordsUpdated = 0;
  let recordsDeactivated = 0;
  let errorMessage: string | undefined;

  try {
    const rawOpps = await samProvider.fetchOpportunities({ limit: 100 });
    recordsFetched = rawOpps.length;

    const seenIds: string[] = [];
    for (const raw of rawOpps) {
      const normalized = samProvider.normalizeOpportunity(raw);
      seenIds.push(normalized.sourceId);

      const existing = await prisma.opportunity.findUnique({
        where: { sourceType_sourceId: { sourceType: 'SAM', sourceId: normalized.sourceId } },
      });

      await upsertOpportunity(normalized);

      if (existing) recordsUpdated++;
      else recordsInserted++;
    }

    recordsDeactivated = await markStaleOpportunitiesInactive('SAM', seenIds);

    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status: 'success',
        recordsFetched,
        recordsInserted,
        recordsUpdated,
        recordsDeactivated,
        finishedAt: new Date(),
      },
    });
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
    logger.error('SAM sync failed', { error: errorMessage });
    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: { status: 'failed', errorMessage, finishedAt: new Date() },
    });
    throw err;
  }

  logger.info('SAM sync complete', { recordsFetched, recordsInserted, recordsUpdated, recordsDeactivated });
}

export async function syncGrantsOpportunities(): Promise<void> {
  const startedAt = new Date();
  const syncRun = await prisma.syncRun.create({
    data: {
      sourceType: 'GRANTS',
      jobType: 'sync',
      status: 'running',
      startedAt,
    },
  });

  let recordsFetched = 0;
  let recordsInserted = 0;
  let recordsUpdated = 0;
  let recordsDeactivated = 0;
  let errorMessage: string | undefined;

  try {
    const rawOpps = await grantsProvider.fetchOpportunities({ limit: 100 });
    recordsFetched = rawOpps.length;

    const seenIds: string[] = [];
    for (const raw of rawOpps) {
      const normalized = grantsProvider.normalizeOpportunity(raw);
      seenIds.push(normalized.sourceId);

      const existing = await prisma.opportunity.findUnique({
        where: { sourceType_sourceId: { sourceType: 'GRANTS', sourceId: normalized.sourceId } },
      });

      await upsertOpportunity(normalized);

      if (existing) recordsUpdated++;
      else recordsInserted++;
    }

    recordsDeactivated = await markStaleOpportunitiesInactive('GRANTS', seenIds);

    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status: 'success',
        recordsFetched,
        recordsInserted,
        recordsUpdated,
        recordsDeactivated,
        finishedAt: new Date(),
      },
    });
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
    logger.error('Grants sync failed', { error: errorMessage });
    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: { status: 'failed', errorMessage, finishedAt: new Date() },
    });
    throw err;
  }

  logger.info('Grants sync complete', { recordsFetched, recordsInserted, recordsUpdated, recordsDeactivated });
}

export async function syncAll(): Promise<void> {
  logger.info('Starting full sync');
  const results = await Promise.allSettled([
    syncSAMOpportunities(),
    syncGrantsOpportunities(),
  ]);
  for (const result of results) {
    if (result.status === 'rejected') {
      logger.error('Sync partially failed', { error: String(result.reason) });
    }
  }
  logger.info('Full sync complete');
}
