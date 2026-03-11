import Nav from '../../Nav';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id } }).catch(() => null);
  if (!customer) notFound();
  const matches = await prisma.opportunityMatch.findMany({
    where: { customerId: id, totalScore: { gte: 50 } },
    include: { opportunity: true },
    orderBy: { totalScore: 'desc' },
    take: 10,
  }).catch(() => []);
  return (
    <>
      <Nav />
      <main className="main">
        <div className="container">
          <div className="actions">
            <Link href="/admin/customers" className="btn btn-secondary">← Back</Link>
          </div>
          <h1>{customer.organizationName}</h1>
          <div className="card">
            <h2>Details</h2>
            <p><strong>Contact:</strong> {customer.contactName}</p>
            <p><strong>Email:</strong> {customer.email}</p>
            <p><strong>Type:</strong> {customer.customerType}</p>
            <p><strong>Status:</strong> {customer.activeStatus ? 'Active' : 'Inactive'}</p>
            <p><strong>Keywords Include:</strong> {customer.keywordsInclude.join(', ') || '—'}</p>
            <p><strong>Keywords Exclude:</strong> {customer.keywordsExclude.join(', ') || '—'}</p>
            <p><strong>NAICS Codes:</strong> {customer.naicsCodes.join(', ') || '—'}</p>
            <p><strong>Agencies:</strong> {customer.agenciesOfInterest.join(', ') || '—'}</p>
            <p><strong>Locations:</strong> {customer.locationsOfInterest.join(', ') || '—'}</p>
            <p><strong>Notes:</strong> {customer.notes || '—'}</p>
          </div>
          <div className="card">
            <h2>Top Matches</h2>
            {matches.length === 0 ? <p className="empty-state">No matches yet.</p> : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Title</th><th>Agency</th><th>Score</th><th>Source</th></tr></thead>
                  <tbody>
                    {matches.map(m => (
                      <tr key={m.id}>
                        <td>{m.opportunity.url ? <a href={m.opportunity.url} target="_blank">{m.opportunity.title}</a> : m.opportunity.title}</td>
                        <td>{m.opportunity.agencyName || '—'}</td>
                        <td><span className="badge badge-blue">{Math.round(m.totalScore)}/100</span></td>
                        <td>{m.opportunity.sourceType}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
