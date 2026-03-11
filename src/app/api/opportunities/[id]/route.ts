import { NextRequest, NextResponse } from 'next/server';
import { getOpportunity } from '@/services/opportunityService';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opp = await getOpportunity(id);
  if (!opp) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(opp);
}
