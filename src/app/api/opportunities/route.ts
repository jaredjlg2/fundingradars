import { NextRequest, NextResponse } from 'next/server';
import { listOpportunities } from '@/services/opportunityService';
import { OpportunityFiltersSchema } from '@/lib/validation';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawFilters = {
    sourceType: searchParams.get('sourceType') ?? undefined,
    isActive: searchParams.has('isActive') ? searchParams.get('isActive') === 'true' : undefined,
    agencyName: searchParams.get('agencyName') ?? undefined,
    keyword: searchParams.get('keyword') ?? undefined,
    postedAfter: searchParams.get('postedAfter') ?? undefined,
    postedBefore: searchParams.get('postedBefore') ?? undefined,
    responseBefore: searchParams.get('responseBefore') ?? undefined,
    limit: searchParams.has('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined,
    offset: searchParams.has('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined,
  };
  const parsed = OpportunityFiltersSchema.safeParse(rawFilters);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  const opps = await listOpportunities(parsed.data);
  return NextResponse.json(opps);
}
