import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { recomputeAllMatches } from '@/services/matchingService';

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const result = await recomputeAllMatches();
  return NextResponse.json({ success: true, ...result });
}
