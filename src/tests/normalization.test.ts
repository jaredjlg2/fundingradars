import { describe, it, expect } from 'vitest';
import { normalizeOpportunity as samNormalize } from '@/providers/sam';
import { normalizeOpportunity as grantsNormalize } from '@/providers/grants';

describe('SAM.gov normalizer', () => {
  it('maps fields correctly', () => {
    const raw = {
      noticeId: 'SAM-TEST-001', title: 'Test Federal Contract',
      fullParentPathName: 'Department of Defense', fullParentPathCode: 'DOD',
      type: 'Solicitation', description: 'A test description', naicsCode: '236220',
      typeOfSetAside: 'SBA', placeOfPerformance: { state: { code: 'VA', name: 'Virginia' } },
      postedDate: '2024-01-15', responseDeadLine: '2024-03-01T17:00:00',
      awardFloor: '50000', awardCeiling: '200000', uiLink: 'https://sam.gov/opp/test', active: 'Yes',
    };
    const n = samNormalize(raw);
    expect(n.sourceType).toBe('SAM');
    expect(n.sourceId).toBe('SAM-TEST-001');
    expect(n.agencyName).toBe('Department of Defense');
    expect(n.naicsCodes).toContain('236220');
    expect(n.awardFloor).toBe(50000);
    expect(n.awardCeiling).toBe(200000);
    expect(n.responseDate).toBeInstanceOf(Date);
  });
});

describe('Grants.gov normalizer', () => {
  it('maps fields correctly', () => {
    const raw = {
      id: 12345, opportunityNumber: 'ED-2024-001', title: 'Youth Education Grant',
      agencyCode: 'ED', agencyName: 'Department of Education', fundingInstrumentType: 'G',
      eligibility: 'Nonprofits with 501(c)(3) status', description: 'Supporting youth education',
      postDate: '2024-01-10', closeDate: '2024-04-15', awardFloor: 25000, awardCeiling: 150000,
      synopsisUrl: 'https://www.grants.gov/web/grants/view-opportunity.html?oppId=12345',
    };
    const n = grantsNormalize(raw);
    expect(n.sourceType).toBe('GRANTS');
    expect(n.sourceId).toBe('ED-2024-001');
    expect(n.awardFloor).toBe(25000);
    expect(n.responseDate).toBeInstanceOf(Date);
  });
});
