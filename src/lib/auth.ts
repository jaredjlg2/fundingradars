import { NextRequest } from 'next/server';
import { config } from '@/lib/config';

export function checkAdminAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return false;
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  return token === config.adminSecret;
}
