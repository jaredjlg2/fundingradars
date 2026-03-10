import { prisma } from '@/lib/db';
import { CreateCustomerInput, UpdateCustomerInput } from '@/lib/validation';
import { logger } from '@/lib/logging';

export async function createCustomer(data: CreateCustomerInput) {
  const customer = await prisma.customer.create({ data });
  logger.info('Customer created', { customerId: customer.id, email: customer.email });
  return customer;
}

export async function getCustomer(id: string) {
  return prisma.customer.findUnique({ where: { id } });
}

export async function listCustomers(filters?: { activeOnly?: boolean }) {
  return prisma.customer.findMany({
    where: filters?.activeOnly ? { activeStatus: true } : undefined,
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateCustomer(id: string, data: UpdateCustomerInput) {
  const customer = await prisma.customer.update({ where: { id }, data });
  logger.info('Customer updated', { customerId: id });
  return customer;
}

export async function deleteCustomer(id: string) {
  await prisma.customer.delete({ where: { id } });
  logger.info('Customer deleted', { customerId: id });
}
