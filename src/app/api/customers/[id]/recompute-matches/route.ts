import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { recomputeMatchesForCustomer } from '@/services/matchingService';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const count = await recomputeMatchesForCustomer(id);
  return NextResponse.json({ success: true, opportunitiesScored: count });
}
