import { prisma } from '@/lib/db';
import { MatchResult, MatchExplanation, DEFAULT_WEIGHTS } from '@/types';
import { logger } from '@/lib/logging';
import { Customer, Opportunity, Prisma } from '@prisma/client';

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function containsKeyword(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

export function applyHardFilters(
  customer: Customer,
  opportunity: Opportunity
): { passed: boolean; rejectionReasons: string[] } {
  const rejectionReasons: string[] = [];
  const now = new Date();

  if (!opportunity.isActive) {
    rejectionReasons.push('Opportunity is inactive');
  }

  if (!customer.activeStatus) {
    rejectionReasons.push('Customer is inactive');
  }

  if (opportunity.responseDate && opportunity.responseDate < now) {
    rejectionReasons.push('Response deadline has passed');
  }

  const searchText = `${opportunity.title} ${opportunity.description ?? ''}`;
  if (customer.keywordsExclude.length > 0 && containsKeyword(searchText, customer.keywordsExclude)) {
    rejectionReasons.push('Excluded keyword found in title or description');
  }

  const today = new Date();
  if (opportunity.responseDate) {
    const daysOut = daysBetween(today, opportunity.responseDate);
    if (customer.dueDateMinDaysOut !== null && customer.dueDateMinDaysOut !== undefined && daysOut < customer.dueDateMinDaysOut) {
      rejectionReasons.push(`Due date too soon (${daysOut} days, min ${customer.dueDateMinDaysOut})`);
    }
    if (customer.dueDateMaxDaysOut !== null && customer.dueDateMaxDaysOut !== undefined && daysOut > customer.dueDateMaxDaysOut) {
      rejectionReasons.push(`Due date too far (${daysOut} days, max ${customer.dueDateMaxDaysOut})`);
    }
  }

  const awardCeiling = opportunity.awardCeiling;
  const awardFloor = opportunity.awardFloor;
  if (customer.minAwardAmount !== null && customer.minAwardAmount !== undefined && awardCeiling !== null && awardCeiling !== undefined && awardCeiling < customer.minAwardAmount) {
    rejectionReasons.push('Award ceiling below customer minimum');
  }
  if (customer.maxAwardAmount !== null && customer.maxAwardAmount !== undefined && awardFloor !== null && awardFloor !== undefined && awardFloor > customer.maxAwardAmount) {
    rejectionReasons.push('Award floor above customer maximum');
  }

  return { passed: rejectionReasons.length === 0, rejectionReasons };
}

export function computeSoftScore(
  customer: Customer,
  opportunity: Opportunity
): { score: number; explanation: MatchExplanation; matchReasons: string[] } {
  const weights = DEFAULT_WEIGHTS;
  const explanation: MatchExplanation = {
    keywordTitle: 0,
    keywordDescription: 0,
    naics: 0,
    agency: 0,
    location: 0,
    setAside: 0,
    awardFit: 0,
    dueDateFit: 0,
    recencyBoost: 0,
    eligibilityFit: 0,
    excludedPenalty: 0,
    mismatchPenalty: 0,
    finalScore: 0,
  };
  const matchReasons: string[] = [];

  // Keyword in title
  if (customer.keywordsInclude.length > 0 && containsKeyword(opportunity.title, customer.keywordsInclude)) {
    explanation.keywordTitle = weights.keywordTitle;
    matchReasons.push('Keyword match in title');
  }

  // Keyword in description
  if (customer.keywordsInclude.length > 0 && opportunity.description && containsKeyword(opportunity.description, customer.keywordsInclude)) {
    explanation.keywordDescription = weights.keywordDescription;
    matchReasons.push('Keyword match in description');
  }

  // NAICS match
  if (customer.naicsCodes.length > 0 && opportunity.naicsCodes.length > 0) {
    const overlap = customer.naicsCodes.some((c) => opportunity.naicsCodes.includes(c));
    if (overlap) {
      explanation.naics = weights.naics;
      matchReasons.push('NAICS code match');
    }
  }

  // Agency match
  if (customer.agenciesOfInterest.length > 0 && opportunity.agencyName) {
    const agencyLower = opportunity.agencyName.toLowerCase();
    const match = customer.agenciesOfInterest.some((a) => agencyLower.includes(a.toLowerCase()));
    if (match) {
      explanation.agency = weights.agency;
      matchReasons.push('Agency of interest match');
    }
  }

  // Location match
  if (customer.locationsOfInterest.length > 0 && opportunity.placeOfPerformance) {
    const locLower = opportunity.placeOfPerformance.toLowerCase();
    const match = customer.locationsOfInterest.some((l) => locLower.includes(l.toLowerCase()));
    if (match) {
      explanation.location = weights.location;
      matchReasons.push('Location match');
    }
  }

  // Set-aside match
  if (customer.setAsidePreferences.length > 0 && opportunity.setAsideType) {
    const match = customer.setAsidePreferences.some(
      (s) => s.toLowerCase() === opportunity.setAsideType!.toLowerCase()
    );
    if (match) {
      explanation.setAside = weights.setAside;
      matchReasons.push('Set-aside preference match');
    }
  }

  // Award fit
  const hasCustMin = customer.minAwardAmount !== null && customer.minAwardAmount !== undefined;
  const hasCustMax = customer.maxAwardAmount !== null && customer.maxAwardAmount !== undefined;
  const hasOppFloor = opportunity.awardFloor !== null && opportunity.awardFloor !== undefined;
  const hasOppCeiling = opportunity.awardCeiling !== null && opportunity.awardCeiling !== undefined;
  if ((hasCustMin || hasCustMax) && (hasOppFloor || hasOppCeiling)) {
    const awardMid = hasOppFloor && hasOppCeiling
      ? ((opportunity.awardFloor! + opportunity.awardCeiling!) / 2)
      : (opportunity.awardFloor ?? opportunity.awardCeiling ?? 0);
    const withinMin = !hasCustMin || awardMid >= customer.minAwardAmount!;
    const withinMax = !hasCustMax || awardMid <= customer.maxAwardAmount!;
    if (withinMin && withinMax) {
      explanation.awardFit = weights.awardFit;
      matchReasons.push('Award amount within preferred range');
    }
  }

  // Due date fit (bonus if within nice window)
  if (opportunity.responseDate) {
    const daysOut = daysBetween(new Date(), opportunity.responseDate);
    if (daysOut >= 7 && daysOut <= 90) {
      explanation.dueDateFit = weights.dueDateFit;
      matchReasons.push('Due date within ideal window');
    }
  }

  // Recency boost
  if (opportunity.postedDate) {
    const age = daysBetween(opportunity.postedDate, new Date());
    if (age <= 7) {
      explanation.recencyBoost = weights.recencyBoost;
      matchReasons.push('Posted within last 7 days');
    }
  }

  // Eligibility fit
  if (opportunity.eligibilityText && customer.customerType) {
    const eligLower = opportunity.eligibilityText.toLowerCase();
    const typeLower = customer.customerType.toLowerCase();
    const eligible =
      eligLower.includes(typeLower) ||
      (typeLower === 'nonprofit' && eligLower.includes('nonprof')) ||
      (typeLower === 'government' && (eligLower.includes('government') || eligLower.includes('state') || eligLower.includes('local')));
    if (eligible) {
      explanation.eligibilityFit = weights.eligibilityFit;
      matchReasons.push('Customer type matches eligibility');
    }
  }

  // Excluded keyword penalty
  const searchText = `${opportunity.title} ${opportunity.description ?? ''}`;
  if (customer.keywordsExclude.length > 0 && containsKeyword(searchText, customer.keywordsExclude)) {
    explanation.excludedPenalty = weights.excludedKeywordPenalty;
  }

  const rawScore =
    explanation.keywordTitle +
    explanation.keywordDescription +
    explanation.naics +
    explanation.agency +
    explanation.location +
    explanation.setAside +
    explanation.awardFit +
    explanation.dueDateFit +
    explanation.recencyBoost +
    explanation.eligibilityFit +
    explanation.excludedPenalty +
    explanation.mismatchPenalty;

  const finalScore = Math.min(100, Math.max(0, rawScore));
  explanation.finalScore = finalScore;

  return { score: finalScore, explanation, matchReasons };
}

export function scoreOpportunityForCustomer(
  customer: Customer,
  opportunity: Opportunity
): MatchResult {
  const { passed, rejectionReasons } = applyHardFilters(customer, opportunity);

  if (!passed) {
    return {
      customerId: customer.id,
      opportunityId: opportunity.id,
      totalScore: 0,
      matchReasons: [],
      rejectionReasons,
      explanationJson: {
        keywordTitle: 0, keywordDescription: 0, naics: 0, agency: 0,
        location: 0, setAside: 0, awardFit: 0, dueDateFit: 0,
        recencyBoost: 0, eligibilityFit: 0, excludedPenalty: 0,
        mismatchPenalty: 0, finalScore: 0,
      },
    };
  }

  const { score, explanation, matchReasons } = computeSoftScore(customer, opportunity);

  return {
    customerId: customer.id,
    opportunityId: opportunity.id,
    totalScore: score,
    matchReasons,
    rejectionReasons: [],
    explanationJson: explanation,
  };
}

export async function recomputeMatchesForCustomer(customerId: string): Promise<number> {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new Error(`Customer ${customerId} not found`);

  const opportunities = await prisma.opportunity.findMany({ where: { isActive: true } });

  let count = 0;
  for (const opp of opportunities) {
    const result = scoreOpportunityForCustomer(customer, opp);
    await prisma.opportunityMatch.upsert({
      where: { customerId_opportunityId: { customerId, opportunityId: opp.id } },
      update: {
        totalScore: result.totalScore,
        matchReasons: result.matchReasons,
        rejectionReasons: result.rejectionReasons,
        explanationJson: result.explanationJson as unknown as Prisma.InputJsonValue,
        matchedAt: new Date(),
      },
      create: {
        customerId,
        opportunityId: opp.id,
        totalScore: result.totalScore,
        matchReasons: result.matchReasons,
        rejectionReasons: result.rejectionReasons,
        explanationJson: result.explanationJson as unknown as Prisma.InputJsonValue,
        matchedAt: new Date(),
      },
    });
    count++;
  }

  logger.info('Recomputed matches for customer', { customerId, opportunityCount: count });
  return count;
}

export async function recomputeMatchesForOpportunity(opportunityId: string): Promise<number> {
  const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
  if (!opportunity) throw new Error(`Opportunity ${opportunityId} not found`);

  const customers = await prisma.customer.findMany({ where: { activeStatus: true } });

  let count = 0;
  for (const customer of customers) {
    const result = scoreOpportunityForCustomer(customer, opportunity);
    await prisma.opportunityMatch.upsert({
      where: { customerId_opportunityId: { customerId: customer.id, opportunityId } },
      update: {
        totalScore: result.totalScore,
        matchReasons: result.matchReasons,
        rejectionReasons: result.rejectionReasons,
        explanationJson: result.explanationJson as unknown as Prisma.InputJsonValue,
        matchedAt: new Date(),
      },
      create: {
        customerId: customer.id,
        opportunityId,
        totalScore: result.totalScore,
        matchReasons: result.matchReasons,
        rejectionReasons: result.rejectionReasons,
        explanationJson: result.explanationJson as unknown as Prisma.InputJsonValue,
        matchedAt: new Date(),
      },
    });
    count++;
  }

  logger.info('Recomputed matches for opportunity', { opportunityId, customerCount: count });
  return count;
}

export async function recomputeAllMatches(): Promise<{ customers: number; opportunities: number; pairs: number }> {
  const customers = await prisma.customer.findMany({ where: { activeStatus: true } });
  const opportunities = await prisma.opportunity.findMany({ where: { isActive: true } });

  let pairs = 0;
  for (const customer of customers) {
    for (const opp of opportunities) {
      const result = scoreOpportunityForCustomer(customer, opp);
      await prisma.opportunityMatch.upsert({
        where: { customerId_opportunityId: { customerId: customer.id, opportunityId: opp.id } },
        update: {
          totalScore: result.totalScore,
          matchReasons: result.matchReasons,
          rejectionReasons: result.rejectionReasons,
          explanationJson: result.explanationJson as unknown as Prisma.InputJsonValue,
          matchedAt: new Date(),
        },
        create: {
          customerId: customer.id,
          opportunityId: opp.id,
          totalScore: result.totalScore,
          matchReasons: result.matchReasons,
          rejectionReasons: result.rejectionReasons,
          explanationJson: result.explanationJson as unknown as Prisma.InputJsonValue,
          matchedAt: new Date(),
        },
      });
      pairs++;
    }
  }

  logger.info('Recomputed all matches', { customers: customers.length, opportunities: opportunities.length, pairs });
  return { customers: customers.length, opportunities: opportunities.length, pairs };
}
