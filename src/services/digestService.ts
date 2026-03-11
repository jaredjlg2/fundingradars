import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { buildDigestHtml, buildDigestText } from '@/templates/weeklyDigestEmail';
import { DigestEmailPayload } from '@/types';
import { logger } from '@/lib/logging';

const MATCH_THRESHOLD = 50;
const MAX_OPPORTUNITIES = 10;

function getWeekPeriod(date: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function generateDigestForCustomer(
  customerId: string,
  periodOverride?: { start: Date; end: Date }
): Promise<{ skipped: boolean; digestId?: string; error?: string }> {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return { skipped: true, error: 'Customer not found' };
  if (!customer.activeStatus || !customer.weeklyDigestEnabled) {
    return { skipped: true };
  }

  const period = periodOverride ?? getWeekPeriod();

  // Idempotency check
  const existing = await prisma.emailDigest.findUnique({
    where: {
      customerId_periodStart_periodEnd: {
        customerId,
        periodStart: period.start,
        periodEnd: period.end,
      },
    },
  });
  if (existing && existing.status === 'sent') {
    logger.info('Digest already sent, skipping', { customerId, digestId: existing.id });
    return { skipped: true, digestId: existing.id };
  }

  // Get previously sent opportunity IDs for this customer
  const previousItems = await prisma.emailDigestItem.findMany({
    where: { digest: { customerId } },
    select: { opportunityId: true },
  });
  const previousOpportunityIds = new Set(previousItems.map((i) => i.opportunityId));

  // Get top matches
  const matches = await prisma.opportunityMatch.findMany({
    where: {
      customerId,
      totalScore: { gte: MATCH_THRESHOLD },
      opportunityId: { notIn: Array.from(previousOpportunityIds) },
      opportunity: { isActive: true },
    },
    include: { opportunity: true },
    orderBy: { totalScore: 'desc' },
    take: MAX_OPPORTUNITIES,
  });

  if (matches.length === 0) {
    logger.info('No new matches above threshold for digest', { customerId });
    return { skipped: true };
  }

  const subject = `Your Weekly Funding Radar Digest – ${matches.length} new opportunities`;

  const payload: DigestEmailPayload = {
    customer: {
      id: customer.id,
      organizationName: customer.organizationName,
      contactName: customer.contactName,
      email: customer.email,
    },
    opportunities: matches.map((m) => ({
      id: m.opportunity.id,
      title: m.opportunity.title,
      agencyName: m.opportunity.agencyName ?? undefined,
      responseDate: m.opportunity.responseDate ?? undefined,
      awardFloor: m.opportunity.awardFloor ?? undefined,
      awardCeiling: m.opportunity.awardCeiling ?? undefined,
      url: m.opportunity.url ?? undefined,
      sourceType: m.opportunity.sourceType,
      matchReasons: m.matchReasons,
      totalScore: m.totalScore,
    })),
    periodStart: period.start,
    periodEnd: period.end,
  };

  const html = buildDigestHtml(payload);
  const text = buildDigestText(payload);

  // Create or update digest record
  const digest = await prisma.emailDigest.upsert({
    where: {
      customerId_periodStart_periodEnd: {
        customerId,
        periodStart: period.start,
        periodEnd: period.end,
      },
    },
    update: { subject, status: 'sending' },
    create: {
      customerId,
      periodStart: period.start,
      periodEnd: period.end,
      subject,
      status: 'sending',
    },
  });

  const emailResult = await sendEmail(customer.email, subject, html, text);

  if (!emailResult.success) {
    await prisma.emailDigest.update({
      where: { id: digest.id },
      data: { status: 'failed', errorMessage: emailResult.error },
    });
    return { skipped: false, digestId: digest.id, error: emailResult.error };
  }

  // Record sent digest and items
  await prisma.$transaction([
    prisma.emailDigest.update({
      where: { id: digest.id },
      data: { status: 'sent', sentAt: new Date() },
    }),
    ...matches.map((m) =>
      prisma.emailDigestItem.create({
        data: {
          emailDigestId: digest.id,
          opportunityId: m.opportunityId,
          scoreAtSend: m.totalScore,
        },
      })
    ),
  ]);

  logger.info('Digest sent', { customerId, digestId: digest.id, opportunityCount: matches.length });
  return { skipped: false, digestId: digest.id };
}

export async function generateWeeklyDigests(): Promise<{
  total: number;
  sent: number;
  skipped: number;
  errors: number;
}> {
  const today = new Date();
  const dayOfWeek = today.getDay();

  const customers = await prisma.customer.findMany({
    where: {
      activeStatus: true,
      weeklyDigestEnabled: true,
      weeklyDigestDay: dayOfWeek,
    },
  });

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (const customer of customers) {
    try {
      const result = await generateDigestForCustomer(customer.id);
      if (result.skipped) skipped++;
      else if (result.error) errors++;
      else sent++;
    } catch (err) {
      logger.error('Error generating digest for customer', {
        customerId: customer.id,
        error: err instanceof Error ? err.message : String(err),
      });
      errors++;
    }
  }

  logger.info('Weekly digests complete', { total: customers.length, sent, skipped, errors });
  return { total: customers.length, sent, skipped, errors };
}
