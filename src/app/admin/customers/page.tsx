import Link from 'next/link';
import Nav from '../Nav';
import { prisma } from '@/lib/db';

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: 'desc' },
  }).catch(() => []);

  return (
    <>
      <Nav />
      <main className="main">
        <div className="container">
          <h1>Customers</h1>
          <div className="actions">
            <Link href="/admin/customers/new" className="btn btn-primary">+ Add Customer</Link>
          </div>
          {customers.length === 0 ? (
            <div className="empty-state">
              <p>No customers yet. <Link href="/admin/customers/new">Add your first customer</Link>.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Organization</th>
                    <th>Contact</th>
                    <th>Email</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Digest</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td><strong>{c.organizationName}</strong></td>
                      <td>{c.contactName}</td>
                      <td>{c.email}</td>
                      <td><span className="badge badge-blue">{c.customerType}</span></td>
                      <td>
                        <span className={`badge ${c.activeStatus ? 'badge-green' : 'badge-red'}`}>
                          {c.activeStatus ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${c.weeklyDigestEnabled ? 'badge-green' : 'badge-gray'}`}>
                          {c.weeklyDigestEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td>
                        <Link href={`/admin/customers/${c.id}`} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                          View
                        </Link>
                      </td>
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
