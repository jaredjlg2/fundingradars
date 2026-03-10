import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    customer: { findUnique: vi.fn() },
    emailDigest: { findUnique: vi.fn(), upsert: vi.fn(), update: vi.fn() },
    emailDigestItem: { findMany: vi.fn(), create: vi.fn() },
    opportunityMatch: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true, id: 'email-123' }),
}));

import { generateDigestForCustomer } from '@/services/digestService';
import { prisma } from '@/lib/db';

describe('digestService - idempotency', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('skips if digest already sent for this period', async () => {
    (prisma.customer.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'cust-1', organizationName: 'Test Org', contactName: 'Test', email: 'test@example.com', activeStatus: true, weeklyDigestEnabled: true,
    });
    (prisma.emailDigest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'digest-1', status: 'sent', sentAt: new Date() });
    const result = await generateDigestForCustomer('cust-1', { start: new Date('2024-01-01'), end: new Date('2024-01-07') });
    expect(result.skipped).toBe(true);
    expect(result.digestId).toBe('digest-1');
  });

  it('skips if no matches above threshold', async () => {
    (prisma.customer.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'cust-1', organizationName: 'Test Org', contactName: 'Test', email: 'test@example.com', activeStatus: true, weeklyDigestEnabled: true,
    });
    (prisma.emailDigest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.emailDigestItem.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.opportunityMatch.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const result = await generateDigestForCustomer('cust-1', { start: new Date('2024-01-01'), end: new Date('2024-01-07') });
    expect(result.skipped).toBe(true);
  });
});
