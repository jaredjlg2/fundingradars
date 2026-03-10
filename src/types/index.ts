export interface NormalizedOpportunity {
  sourceType: string;
  sourceId: string;
  title: string;
  agencyName?: string;
  agencyCode?: string;
  noticeType?: string;
  description?: string;
  eligibilityText?: string;
  naicsCodes: string[];
  setAsideType?: string;
  placeOfPerformance?: string;
  postedDate?: Date;
  responseDate?: Date;
  awardFloor?: number;
  awardCeiling?: number;
  url?: string;
  rawJson: Record<string, unknown>;
}

export interface MatchResult {
  customerId: string;
  opportunityId: string;
  totalScore: number;
  matchReasons: string[];
  rejectionReasons: string[];
  explanationJson: MatchExplanation;
}

export interface MatchExplanation {
  keywordTitle: number;
  keywordDescription: number;
  naics: number;
  agency: number;
  location: number;
  setAside: number;
  awardFit: number;
  dueDateFit: number;
  recencyBoost: number;
  eligibilityFit: number;
  excludedPenalty: number;
  mismatchPenalty: number;
  finalScore: number;
}

export interface DigestEmailPayload {
  customer: {
    id: string;
    organizationName: string;
    contactName: string;
    email: string;
  };
  opportunities: Array<{
    id: string;
    title: string;
    agencyName?: string;
    responseDate?: Date;
    awardFloor?: number;
    awardCeiling?: number;
    url?: string;
    sourceType: string;
    matchReasons: string[];
    totalScore: number;
  }>;
  periodStart: Date;
  periodEnd: Date;
}

export interface ScoringWeights {
  keywordTitle: number;
  keywordDescription: number;
  naics: number;
  agency: number;
  location: number;
  setAside: number;
  awardFit: number;
  dueDateFit: number;
  recencyBoost: number;
  eligibilityFit: number;
  excludedKeywordPenalty: number;
  obviousMismatchPenalty: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  keywordTitle: 20,
  keywordDescription: 10,
  naics: 20,
  agency: 10,
  location: 5,
  setAside: 10,
  awardFit: 10,
  dueDateFit: 10,
  recencyBoost: 5,
  eligibilityFit: 10,
  excludedKeywordPenalty: -30,
  obviousMismatchPenalty: -40,
};
