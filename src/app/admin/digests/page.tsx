import Nav from '../Nav';
import { prisma } from '@/lib/db';

export default async function DigestsPage() {
  const digests = await prisma.emailDigest.findMany({
    include: { customer: true, items: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  }).catch(() => []);
  return (
    <>
      <Nav />
      <main className="main">
        <div className="container">
          <h1>Email Digests</h1>
          {digests.length === 0 ? <div className="empty-state">No digests sent yet.</div> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Customer</th><th>Period</th><th>Status</th><th>Items</th><th>Sent At</th></tr></thead>
                <tbody>
                  {digests.map(d => (
                    <tr key={d.id}>
                      <td>{d.customer.organizationName}</td>
                      <td>{new Date(d.periodStart).toLocaleDateString()} – {new Date(d.periodEnd).toLocaleDateString()}</td>
                      <td><span className={`badge ${d.status === 'sent' ? 'badge-green' : d.status === 'failed' ? 'badge-red' : 'badge-gray'}`}>{d.status}</span></td>
                      <td>{d.items.length}</td>
                      <td>{d.sentAt ? new Date(d.sentAt).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
