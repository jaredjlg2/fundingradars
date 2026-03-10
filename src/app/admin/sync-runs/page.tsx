import Nav from '../Nav';
import { prisma } from '@/lib/db';

export default async function SyncRunsPage() {
  const runs = await prisma.syncRun.findMany({
    orderBy: { startedAt: 'desc' },
    take: 100,
  }).catch(() => []);
  return (
    <>
      <Nav />
      <main className="main">
        <div className="container">
          <h1>Sync Runs</h1>
          {runs.length === 0 ? <div className="empty-state">No sync runs yet. Trigger a sync from the dashboard.</div> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Source</th><th>Status</th><th>Fetched</th><th>Inserted</th><th>Updated</th><th>Deactivated</th><th>Started</th><th>Duration</th></tr></thead>
                <tbody>
                  {runs.map(r => (
                    <tr key={r.id}>
                      <td>{r.sourceType}</td>
                      <td><span className={`badge ${r.status === 'success' ? 'badge-green' : r.status === 'failed' ? 'badge-red' : 'badge-gray'}`}>{r.status}</span></td>
                      <td>{r.recordsFetched}</td>
                      <td>{r.recordsInserted}</td>
                      <td>{r.recordsUpdated}</td>
                      <td>{r.recordsDeactivated}</td>
                      <td>{new Date(r.startedAt).toLocaleString()}</td>
                      <td>{r.finishedAt ? `${Math.round((new Date(r.finishedAt).getTime() - new Date(r.startedAt).getTime()) / 1000)}s` : '—'}</td>
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
