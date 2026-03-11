import { NormalizedOpportunity } from '@/types';
import { logger } from '@/lib/logging';
import { config } from '@/lib/config';

// TODO: Verify exact SAM.gov API v2 response field names against live API documentation
// Reference: https://open.gsa.gov/api/get-opportunities-public-api/

interface SamOpportunityRaw {
  noticeId?: string;
  title?: string;
  solicitationNumber?: string;
  fullParentPathName?: string;
  fullParentPathCode?: string;
  type?: string;
  description?: string;
  organizationHierarchy?: Array<{ name?: string; code?: string }>;
  naicsCode?: string;
  classificationCode?: string;
  typeOfSetAside?: string;
  typeOfSetAsideDescription?: string;
  placeOfPerformance?: {
    city?: { code?: string; name?: string };
    state?: { code?: string; name?: string };
    country?: { code?: string };
  };
  postedDate?: string;
  responseDeadLine?: string;
  awardFloor?: string | number;
  awardCeiling?: string | number;
  additionalInfoLink?: string;
  uiLink?: string;
  eligible?: string;
  active?: string;
}

interface SamApiResponse {
  opportunitiesData?: SamOpportunityRaw[];
  totalRecords?: number;
}

const SAM_MOCK_DATA: SamOpportunityRaw[] = [
  {
    noticeId: 'SAM-MOCK-001',
    title: 'Construction Services for Federal Building Renovation',
    type: 'Solicitation',
    description: 'Seeking qualified small business contractors for renovation of federal office building including infrastructure upgrades and facilities management.',
    fullParentPathName: 'General Services Administration',
    fullParentPathCode: 'GSA',
    naicsCode: '236220',
    typeOfSetAside: 'SBA',
    typeOfSetAsideDescription: 'Small Business',
    placeOfPerformance: { state: { code: 'DC', name: 'District of Columbia' } },
    postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    responseDeadLine: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    awardFloor: '100000',
    awardCeiling: '500000',
    uiLink: 'https://sam.gov/opp/mock-001',
    active: 'Yes',
  },
  {
    noticeId: 'SAM-MOCK-002',
    title: 'Transportation Infrastructure Maintenance Contract',
    type: 'Solicitation',
    description: 'Public works transportation maintenance services for federal highways and bridges.',
    fullParentPathName: 'Department of Transportation',
    fullParentPathCode: 'DOT',
    naicsCode: '237310',
    typeOfSetAside: 'NONE',
    placeOfPerformance: { state: { code: 'VA', name: 'Virginia' } },
    postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    responseDeadLine: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    awardFloor: '250000',
    awardCeiling: '2000000',
    uiLink: 'https://sam.gov/opp/mock-002',
    active: 'Yes',
  },
];

export async function fetchOpportunities(params?: {
  keyword?: string;
  naicsCode?: string;
  limit?: number;
  offset?: number;
  postedFrom?: string;
  postedTo?: string;
}): Promise<SamOpportunityRaw[]> {
  if (!config.samApiKey) {
    logger.warn('SAM_API_KEY not set – returning mock SAM.gov data');
    return SAM_MOCK_DATA;
  }

  const searchParams = new URLSearchParams({
    api_key: config.samApiKey,
    limit: String(params?.limit ?? 100),
    offset: String(params?.offset ?? 0),
    ...(params?.keyword ? { keyword: params.keyword } : {}),
    ...(params?.naicsCode ? { naicsCode: params.naicsCode } : {}),
    // TODO: Confirm exact date filter param names in SAM.gov v2 API
    ...(params?.postedFrom ? { postedFrom: params.postedFrom } : {}),
    ...(params?.postedTo ? { postedTo: params.postedTo } : {}),
  });

  const url = `https://api.sam.gov/opportunities/v2/search?${searchParams}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`SAM.gov API returned HTTP ${response.status}`);
    }

    const data = (await response.json()) as SamApiResponse;
    return data.opportunitiesData ?? [];
  } catch (err) {
    logger.error('Failed to fetch SAM.gov opportunities', {
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

export function normalizeOpportunity(raw: SamOpportunityRaw): NormalizedOpportunity {
  // TODO: Verify actual field names from live SAM.gov API response
  const agency = raw.organizationHierarchy?.[0]?.name ?? raw.fullParentPathName;
  const agencyCode = raw.organizationHierarchy?.[0]?.code ?? raw.fullParentPathCode;

  const place = raw.placeOfPerformance;
  let placeOfPerformance: string | undefined;
  if (place) {
    const parts = [place.city?.name, place.state?.name ?? place.state?.code, place.country?.code]
      .filter(Boolean);
    placeOfPerformance = parts.join(', ') || undefined;
  }

  return {
    sourceType: 'SAM',
    sourceId: raw.noticeId ?? `sam-${Date.now()}`,
    title: raw.title ?? 'Untitled',
    agencyName: agency,
    agencyCode: agencyCode,
    noticeType: raw.type,
    description: raw.description,
    eligibilityText: raw.eligible,
    naicsCodes: raw.naicsCode ? [raw.naicsCode] : [],
    setAsideType: raw.typeOfSetAside,
    placeOfPerformance,
    postedDate: raw.postedDate ? new Date(raw.postedDate) : undefined,
    responseDate: raw.responseDeadLine ? new Date(raw.responseDeadLine) : undefined,
    awardFloor: raw.awardFloor !== undefined ? Number(raw.awardFloor) : undefined,
    awardCeiling: raw.awardCeiling !== undefined ? Number(raw.awardCeiling) : undefined,
    url: raw.uiLink ?? raw.additionalInfoLink,
    rawJson: raw as unknown as Record<string, unknown>,
  };
}
