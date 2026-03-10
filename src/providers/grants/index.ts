import { NormalizedOpportunity } from '@/types';
import { logger } from '@/lib/logging';

// TODO: Verify exact Grants.gov REST API response field names
// Reference: https://www.grants.gov/developers/api

interface GrantsOpportunityRaw {
  id?: string | number;
  opportunityNumber?: string;
  title?: string;
  agencyCode?: string;
  agencyName?: string;
  opportunityCategory?: string;
  fundingInstrumentType?: string;
  eligibility?: string;
  description?: string;
  cfdaNumbers?: string[];
  postDate?: string;
  closeDate?: string;
  awardFloor?: number;
  awardCeiling?: number;
  estimatedTotalProgramFunding?: number;
  numberOfAwards?: number;
  opportunityStatus?: string;
  synopsisUrl?: string;
}

interface GrantsApiResponse {
  opportunityList?: GrantsOpportunityRaw[];
  totalResults?: number;
}

const GRANTS_MOCK_DATA: GrantsOpportunityRaw[] = [
  {
    id: 'GRANTS-MOCK-001',
    opportunityNumber: 'ED-GRANTS-MOCK-001',
    title: 'Youth Education and Community Development Grant',
    agencyCode: 'ED',
    agencyName: 'Department of Education',
    opportunityCategory: 'D',
    fundingInstrumentType: 'G',
    eligibility: 'Nonprofits having a 501(c)(3) status with the IRS',
    description: 'Supporting education programs for youth and community development including social services and outreach.',
    postDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    closeDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    awardFloor: 50000,
    awardCeiling: 300000,
    synopsisUrl: 'https://www.grants.gov/web/grants/view-opportunity.html?oppId=mock-001',
    opportunityStatus: 'posted',
  },
  {
    id: 'GRANTS-MOCK-002',
    opportunityNumber: 'FEMA-GRANTS-MOCK-002',
    title: 'Emergency Management Preparedness Grant',
    agencyCode: 'DHS',
    agencyName: 'Department of Homeland Security / FEMA',
    opportunityCategory: 'D',
    fundingInstrumentType: 'G',
    eligibility: 'State governments, Local governments',
    description: 'Funding for local government emergency management and public safety preparedness programs.',
    postDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    closeDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    awardFloor: 100000,
    awardCeiling: 1000000,
    synopsisUrl: 'https://www.grants.gov/web/grants/view-opportunity.html?oppId=mock-002',
    opportunityStatus: 'posted',
  },
];

export async function fetchOpportunities(params?: {
  keyword?: string;
  limit?: number;
  offset?: number;
  oppStatuses?: string;
}): Promise<GrantsOpportunityRaw[]> {
  // TODO: Grants.gov API key usage - confirm if/how API key is required for search
  const requestBody = {
    rows: params?.limit ?? 100,
    startRecordNum: params?.offset ?? 0,
    keyword: params?.keyword ?? '',
    oppStatuses: params?.oppStatuses ?? 'posted',
  };

  const url = 'https://apply07.grants.gov/grantsws/rest/opportunities/search/';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Grants.gov API returned HTTP ${response.status}`);
    }

    const data = (await response.json()) as GrantsApiResponse;
    return data.opportunityList ?? [];
  } catch (err) {
    logger.warn('Failed to fetch Grants.gov opportunities – returning mock data', {
      error: err instanceof Error ? err.message : String(err),
    });
    return GRANTS_MOCK_DATA;
  }
}

export function normalizeOpportunity(raw: GrantsOpportunityRaw): NormalizedOpportunity {
  // TODO: Verify actual Grants.gov response field names against live API
  const sourceId = raw.opportunityNumber ?? String(raw.id) ?? `grants-${Date.now()}`;

  return {
    sourceType: 'GRANTS',
    sourceId,
    title: raw.title ?? 'Untitled',
    agencyName: raw.agencyName,
    agencyCode: raw.agencyCode,
    noticeType: raw.fundingInstrumentType,
    description: raw.description,
    eligibilityText: raw.eligibility,
    naicsCodes: [],
    setAsideType: undefined,
    placeOfPerformance: undefined,
    postedDate: raw.postDate ? new Date(raw.postDate) : undefined,
    responseDate: raw.closeDate ? new Date(raw.closeDate) : undefined,
    awardFloor: raw.awardFloor,
    awardCeiling: raw.awardCeiling,
    url: raw.synopsisUrl,
    rawJson: raw as unknown as Record<string, unknown>,
  };
}
