import Nav from '../Nav';
import { prisma } from '@/lib/db';

export default async function MatchesPage() {
  const matches = await prisma.opportunityMatch.findMany({
    where: { totalScore: { gte: 50 } },
    include: { customer: true, opportunity: true },
    orderBy: { totalScore: 'desc' },
    take: 100,
  }).catch(() => []);
  return (
    <>
      <Nav />
      <main className="main">
        <div className="container">
          <h1>Top Matches</h1>
          {matches.length === 0 ? <div className="empty-state">No matches yet. Run recompute matches.</div> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Customer</th><th>Opportunity</th><th>Score</th><th>Reasons</th></tr></thead>
                <tbody>
                  {matches.map(m => (
                    <tr key={m.id}>
                      <td>{m.customer.organizationName}</td>
                      <td>{m.opportunity.title}</td>
                      <td><span className="badge badge-blue">{Math.round(m.totalScore)}/100</span></td>
                      <td style={{fontSize:'0.75rem',color:'#059669'}}>{m.matchReasons.join(', ')}</td>
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
