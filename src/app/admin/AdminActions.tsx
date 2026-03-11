'use client';
import { useState } from 'react';

export default function AdminActions() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function runJob(endpoint: string, label: string) {
    const secret = prompt('Enter admin secret:');
    if (!secret) return;
    setLoading(true);
    setStatus(`Running ${label}...`);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${secret}` },
      });
      const data = await res.json();
      setStatus(`${label} complete: ${JSON.stringify(data)}`);
    } catch (err) {
      setStatus(`Error: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="actions">
        <button className="btn btn-success" disabled={loading} onClick={() => runJob('/api/jobs/sync-opportunities', 'Sync Opportunities')}>
          🔄 Run Sync Now
        </button>
        <button className="btn btn-primary" disabled={loading} onClick={() => runJob('/api/matches/recompute-all', 'Recompute Matches')}>
          ⚡ Recompute All Matches
        </button>
        <button className="btn btn-secondary" disabled={loading} onClick={() => runJob('/api/jobs/send-weekly-digests', 'Send Weekly Digests')}>
          📧 Send Digests Now
        </button>
      </div>
      {status && <div className="alert alert-success">{status}</div>}
    </div>
  );
}
