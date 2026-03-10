import { describe, it, expect } from 'vitest';
import { applyHardFilters, computeSoftScore, scoreOpportunityForCustomer } from '@/services/matchingService';
import type { Customer, Opportunity } from '@prisma/client';

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 'cust-1', organizationName: 'Test Org', contactName: 'Test Contact',
    email: 'test@example.com', customerType: 'BUSINESS',
    keywordsInclude: ['construction', 'infrastructure'], keywordsExclude: ['defense', 'military'],
    naicsCodes: ['236220', '237310'], agenciesOfInterest: ['General Services Administration'],
    locationsOfInterest: ['Virginia'], setAsidePreferences: ['SBA'],
    minAwardAmount: null, maxAwardAmount: null, dueDateMinDaysOut: null, dueDateMaxDaysOut: null,
    activeStatus: true, weeklyDigestEnabled: true, weeklyDigestDay: 1,
    timezone: 'America/New_York', notes: null, createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  };
}

function makeOpportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: 'opp-1', sourceType: 'SAM', sourceId: 'SAM-001', title: 'Construction Services Contract',
    agencyName: 'General Services Administration', agencyCode: 'GSA', noticeType: 'Solicitation',
    description: 'Federal building construction and infrastructure improvements.',
    eligibilityText: 'Small business', naicsCodes: ['236220'], setAsideType: 'SBA',
    placeOfPerformance: 'Virginia', postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    responseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    awardFloor: 100000, awardCeiling: 500000, url: 'https://sam.gov/opp/test',
    rawJson: {}, lastSeenAt: new Date(), isActive: true, createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  };
}

describe('matchingService - hard filters', () => {
  it('rejects inactive opportunity', () => {
    const { passed, rejectionReasons } = applyHardFilters(makeCustomer(), makeOpportunity({ isActive: false }));
    expect(passed).toBe(false);
    expect(rejectionReasons).toContain('Opportunity is inactive');
  });

  it('rejects past responseDate', () => {
    const { passed, rejectionReasons } = applyHardFilters(makeCustomer(), makeOpportunity({ responseDate: new Date(Date.now() - 24 * 60 * 60 * 1000) }));
    expect(passed).toBe(false);
    expect(rejectionReasons).toContain('Response deadline has passed');
  });

  it('rejects excluded keyword in title', () => {
    const { passed, rejectionReasons } = applyHardFilters(makeCustomer({ keywordsExclude: ['defense'] }), makeOpportunity({ title: 'Defense Systems Maintenance' }));
    expect(passed).toBe(false);
    expect(rejectionReasons.some(r => r.includes('Excluded keyword'))).toBe(true);
  });
});

describe('matchingService - soft scoring', () => {
  it('adds points for keyword match in title', () => {
    const { score, explanation } = computeSoftScore(makeCustomer({ keywordsInclude: ['construction'] }), makeOpportunity({ title: 'Construction Services Contract', description: 'Some description' }));
    expect(explanation.keywordTitle).toBeGreaterThan(0);
    expect(score).toBeGreaterThan(0);
  });

  it('adds points for NAICS match', () => {
    const { explanation } = computeSoftScore(makeCustomer({ naicsCodes: ['236220'], keywordsInclude: [] }), makeOpportunity({ naicsCodes: ['236220'], title: 'Some Contract', description: null }));
    expect(explanation.naics).toBeGreaterThan(0);
  });

  it('adds points for award range fit', () => {
    const { explanation } = computeSoftScore(makeCustomer({ minAwardAmount: 50000, maxAwardAmount: 600000, keywordsInclude: [] }), makeOpportunity({ awardFloor: 100000, awardCeiling: 500000, title: 'Contract', description: null }));
    expect(explanation.awardFit).toBeGreaterThan(0);
  });

  it('clamps final score between 0 and 100', () => {
    const result = scoreOpportunityForCustomer(makeCustomer(), makeOpportunity());
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.totalScore).toBeLessThanOrEqual(100);
  });
});
