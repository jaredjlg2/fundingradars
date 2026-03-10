import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const minScore = parseFloat(searchParams.get('minScore') ?? '0');
  const matches = await prisma.opportunityMatch.findMany({
    where: { customerId: params.id, totalScore: { gte: minScore } },
    include: { opportunity: true },
    orderBy: { totalScore: 'desc' },
    take: 50,
  });
  return NextResponse.json(matches);
}
