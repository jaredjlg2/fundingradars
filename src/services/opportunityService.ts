import { prisma } from '@/lib/db';
import { NormalizedOpportunity } from '@/types';
import { OpportunityFilters } from '@/lib/validation';
import { logger } from '@/lib/logging';
import { Prisma } from '@prisma/client';

export async function upsertOpportunity(normalized: NormalizedOpportunity) {
  const now = new Date();
  const result = await prisma.opportunity.upsert({
    where: {
      sourceType_sourceId: {
        sourceType: normalized.sourceType,
        sourceId: normalized.sourceId,
      },
    },
    update: {
      title: normalized.title,
      agencyName: normalized.agencyName,
      agencyCode: normalized.agencyCode,
      noticeType: normalized.noticeType,
      description: normalized.description,
      eligibilityText: normalized.eligibilityText,
      naicsCodes: normalized.naicsCodes,
      setAsideType: normalized.setAsideType,
      placeOfPerformance: normalized.placeOfPerformance,
      postedDate: normalized.postedDate,
      responseDate: normalized.responseDate,
      awardFloor: normalized.awardFloor,
      awardCeiling: normalized.awardCeiling,
      url: normalized.url,
      rawJson: normalized.rawJson as unknown as Prisma.InputJsonValue,
      lastSeenAt: now,
      isActive: true,
    },
    create: {
      sourceType: normalized.sourceType,
      sourceId: normalized.sourceId,
      title: normalized.title,
      agencyName: normalized.agencyName,
      agencyCode: normalized.agencyCode,
      noticeType: normalized.noticeType,
      description: normalized.description,
      eligibilityText: normalized.eligibilityText,
      naicsCodes: normalized.naicsCodes,
      setAsideType: normalized.setAsideType,
      placeOfPerformance: normalized.placeOfPerformance,
      postedDate: normalized.postedDate,
      responseDate: normalized.responseDate,
      awardFloor: normalized.awardFloor,
      awardCeiling: normalized.awardCeiling,
      url: normalized.url,
      rawJson: normalized.rawJson as unknown as Prisma.InputJsonValue,
      lastSeenAt: now,
      isActive: true,
    },
  });
  return result;
}

export async function listOpportunities(filters: Partial<OpportunityFilters>) {
  const where: Prisma.OpportunityWhereInput = {};

  if (filters.sourceType) where.sourceType = filters.sourceType;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.agencyName) where.agencyName = { contains: filters.agencyName, mode: 'insensitive' };
  if (filters.keyword) {
    where.OR = [
      { title: { contains: filters.keyword, mode: 'insensitive' } },
      { description: { contains: filters.keyword, mode: 'insensitive' } },
    ];
  }
  if (filters.postedAfter || filters.postedBefore) {
    where.postedDate = {
      ...(filters.postedAfter ? { gte: new Date(filters.postedAfter) } : {}),
      ...(filters.postedBefore ? { lte: new Date(filters.postedBefore) } : {}),
    };
  }
  if (filters.responseBefore) {
    where.responseDate = { lte: new Date(filters.responseBefore) };
  }

  return prisma.opportunity.findMany({
    where,
    orderBy: { postedDate: 'desc' },
    take: filters.limit ?? 50,
    skip: filters.offset ?? 0,
  });
}

export async function getOpportunity(id: string) {
  return prisma.opportunity.findUnique({ where: { id } });
}

export async function markStaleOpportunitiesInactive(sourceType: string, seenIds: string[]) {
  const result = await prisma.opportunity.updateMany({
    where: {
      sourceType,
      sourceId: { notIn: seenIds },
      isActive: true,
    },
    data: { isActive: false },
  });
  logger.info('Marked stale opportunities inactive', {
    sourceType,
    count: result.count,
  });
  return result.count;
}
