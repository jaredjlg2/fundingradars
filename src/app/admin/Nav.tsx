import Link from 'next/link';

export default function Nav() {
  return (
    <nav className="nav">
      <div className="container">
        <Link href="/admin" className="brand">📡 Funding Radar</Link>
        <Link href="/admin">Dashboard</Link>
        <Link href="/admin/customers">Customers</Link>
        <Link href="/admin/opportunities">Opportunities</Link>
        <Link href="/admin/matches">Matches</Link>
        <Link href="/admin/digests">Digests</Link>
        <Link href="/admin/sync-runs">Sync Runs</Link>
      </div>
    </nav>
  );
}
