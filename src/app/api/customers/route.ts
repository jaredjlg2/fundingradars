import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { createCustomer, listCustomers } from '@/services/customerService';
import { CreateCustomerSchema } from '@/lib/validation';

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const activeOnly = searchParams.get('activeOnly') === 'true';
  const customers = await listCustomers({ activeOnly });
  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const parsed = CreateCustomerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  const customer = await createCustomer(parsed.data);
  return NextResponse.json(customer, { status: 201 });
}
