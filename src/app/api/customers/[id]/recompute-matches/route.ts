import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { recomputeMatchesForCustomer } from '@/services/matchingService';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const count = await recomputeMatchesForCustomer(params.id);
  return NextResponse.json({ success: true, opportunitiesScored: count });
}
