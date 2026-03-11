import Nav from '../Nav';
import { prisma } from '@/lib/db';

export default async function OpportunitiesPage() {
  const opps = await prisma.opportunity.findMany({
    where: { isActive: true },
    orderBy: { postedDate: 'desc' },
    take: 100,
  }).catch(() => []);
  return (
    <>
      <Nav />
      <main className="main">
        <div className="container">
          <h1>Opportunities ({opps.length})</h1>
          {opps.length === 0 ? <div className="empty-state">No opportunities. Run a sync to fetch data.</div> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Title</th><th>Agency</th><th>Source</th><th>NAICS</th><th>Response Date</th><th>Award Range</th></tr></thead>
                <tbody>
                  {opps.map(o => (
                    <tr key={o.id}>
                      <td>{o.url ? <a href={o.url} target="_blank">{o.title}</a> : o.title}</td>
                      <td>{o.agencyName || '—'}</td>
                      <td><span className="badge badge-gray">{o.sourceType}</span></td>
                      <td>{o.naicsCodes.join(', ') || '—'}</td>
                      <td>{o.responseDate ? new Date(o.responseDate).toLocaleDateString() : '—'}</td>
                      <td>{o.awardFloor || o.awardCeiling ? `$${(o.awardFloor ?? 0).toLocaleString()} – $${(o.awardCeiling ?? 0).toLocaleString()}` : '—'}</td>
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
