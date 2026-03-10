import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { generateWeeklyDigests } from '@/services/digestService';

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const result = await generateWeeklyDigests();
  return NextResponse.json({ success: true, ...result });
}
