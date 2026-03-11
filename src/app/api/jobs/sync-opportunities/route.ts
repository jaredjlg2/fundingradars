import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { syncAll } from '@/services/syncService';

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await syncAll();
  return NextResponse.json({ success: true, message: 'Sync complete' });
}
