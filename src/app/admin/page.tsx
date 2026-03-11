import Link from 'next/link';
import Nav from './Nav';
import AdminActions from './AdminActions';
import { prisma } from '@/lib/db';

export default async function AdminDashboard() {
  const [customerCount, opportunityCount, matchCount, digestCount] = await Promise.all([
    prisma.customer.count(),
    prisma.opportunity.count({ where: { isActive: true } }),
    prisma.opportunityMatch.count(),
    prisma.emailDigest.count({ where: { status: 'sent' } }),
  ]).catch(() => [0, 0, 0, 0]);

  return (
    <>
      <Nav />
      <main className="main">
        <div className="container">
          <h1>Admin Dashboard</h1>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="value">{customerCount}</div>
              <div className="label">Customers</div>
            </div>
            <div className="stat-card">
              <div className="value">{opportunityCount}</div>
              <div className="label">Active Opportunities</div>
            </div>
            <div className="stat-card">
              <div className="value">{matchCount}</div>
              <div className="label">Matches</div>
            </div>
            <div className="stat-card">
              <div className="value">{digestCount}</div>
              <div className="label">Digests Sent</div>
            </div>
          </div>
          <div className="actions">
            <Link href="/admin/customers/new" className="btn btn-primary">+ Add Customer</Link>
            <Link href="/admin/customers" className="btn btn-secondary">Manage Customers</Link>
            <Link href="/admin/opportunities" className="btn btn-secondary">View Opportunities</Link>
            <Link href="/admin/sync-runs" className="btn btn-secondary">Sync History</Link>
          </div>
          <div className="card">
            <h2>Quick Actions</h2>
            <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Use the buttons below to trigger manual jobs. These require your admin API key.
            </p>
            <AdminActions />
          </div>
        </div>
      </main>
    </>
  );
}
