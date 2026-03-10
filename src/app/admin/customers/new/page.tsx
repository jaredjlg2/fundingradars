'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '../../Nav';

export default function NewCustomerPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const secret = (document.getElementById('adminSecret') as HTMLInputElement)?.value ?? '';

    const body = {
      organizationName: formData.get('organizationName'),
      contactName: formData.get('contactName'),
      email: formData.get('email'),
      customerType: formData.get('customerType'),
      keywordsInclude: String(formData.get('keywordsInclude') ?? '').split(',').map(s => s.trim()).filter(Boolean),
      keywordsExclude: String(formData.get('keywordsExclude') ?? '').split(',').map(s => s.trim()).filter(Boolean),
      naicsCodes: String(formData.get('naicsCodes') ?? '').split(',').map(s => s.trim()).filter(Boolean),
      agenciesOfInterest: String(formData.get('agenciesOfInterest') ?? '').split('\n').map(s => s.trim()).filter(Boolean),
      locationsOfInterest: String(formData.get('locationsOfInterest') ?? '').split(',').map(s => s.trim()).filter(Boolean),
      setAsidePreferences: String(formData.get('setAsidePreferences') ?? '').split(',').map(s => s.trim()).filter(Boolean),
      minAwardAmount: formData.get('minAwardAmount') ? Number(formData.get('minAwardAmount')) : undefined,
      maxAwardAmount: formData.get('maxAwardAmount') ? Number(formData.get('maxAwardAmount')) : undefined,
      weeklyDigestEnabled: formData.get('weeklyDigestEnabled') === 'true',
      weeklyDigestDay: Number(formData.get('weeklyDigestDay') ?? 1),
      timezone: formData.get('timezone') ?? 'America/New_York',
      notes: formData.get('notes') ?? undefined,
    };

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(JSON.stringify(data.error));
        return;
      }

      router.push('/admin/customers');
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Nav />
      <main className="main">
        <div className="container">
          <h1>Add New Customer</h1>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="adminSecret">Admin Secret *</label>
              <input id="adminSecret" type="text" placeholder="Your admin secret key" required />
            </div>
            <div className="form-row">
              <label htmlFor="organizationName">Organization Name *</label>
              <input id="organizationName" name="organizationName" type="text" required />
            </div>
            <div className="form-row">
              <label htmlFor="contactName">Contact Name *</label>
              <input id="contactName" name="contactName" type="text" required />
            </div>
            <div className="form-row">
              <label htmlFor="email">Email *</label>
              <input id="email" name="email" type="email" required />
            </div>
            <div className="form-row">
              <label htmlFor="customerType">Customer Type</label>
              <select id="customerType" name="customerType">
                <option value="BUSINESS">Business</option>
                <option value="SMALL_BUSINESS">Small Business</option>
                <option value="NONPROFIT">Nonprofit</option>
                <option value="GOVERNMENT">Government</option>
              </select>
            </div>
            <div className="form-row">
              <label htmlFor="keywordsInclude">Keywords to Include (comma-separated)</label>
              <input id="keywordsInclude" name="keywordsInclude" type="text" placeholder="construction, infrastructure, renovation" />
            </div>
            <div className="form-row">
              <label htmlFor="keywordsExclude">Keywords to Exclude (comma-separated)</label>
              <input id="keywordsExclude" name="keywordsExclude" type="text" placeholder="defense, military" />
            </div>
            <div className="form-row">
              <label htmlFor="naicsCodes">NAICS Codes (comma-separated)</label>
              <input id="naicsCodes" name="naicsCodes" type="text" placeholder="236220, 237310" />
            </div>
            <div className="form-row">
              <label htmlFor="agenciesOfInterest">Agencies of Interest (one per line)</label>
              <textarea id="agenciesOfInterest" name="agenciesOfInterest" placeholder="General Services Administration&#10;Department of Transportation" />
            </div>
            <div className="form-row">
              <label htmlFor="locationsOfInterest">Locations of Interest (comma-separated)</label>
              <input id="locationsOfInterest" name="locationsOfInterest" type="text" placeholder="Virginia, Maryland" />
            </div>
            <div className="form-row">
              <label htmlFor="setAsidePreferences">Set-Aside Preferences (comma-separated)</label>
              <input id="setAsidePreferences" name="setAsidePreferences" type="text" placeholder="SBA, 8A" />
            </div>
            <div className="form-row">
              <label htmlFor="minAwardAmount">Min Award Amount ($)</label>
              <input id="minAwardAmount" name="minAwardAmount" type="number" min="0" />
            </div>
            <div className="form-row">
              <label htmlFor="maxAwardAmount">Max Award Amount ($)</label>
              <input id="maxAwardAmount" name="maxAwardAmount" type="number" min="0" />
            </div>
            <div className="form-row">
              <label htmlFor="weeklyDigestEnabled">Weekly Digest</label>
              <select id="weeklyDigestEnabled" name="weeklyDigestEnabled">
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>
            <div className="form-row">
              <label htmlFor="weeklyDigestDay">Digest Day</label>
              <select id="weeklyDigestDay" name="weeklyDigestDay">
                <option value="0">Sunday</option>
                <option value="1">Monday</option>
                <option value="2">Tuesday</option>
                <option value="3">Wednesday</option>
                <option value="4">Thursday</option>
                <option value="5">Friday</option>
                <option value="6">Saturday</option>
              </select>
            </div>
            <div className="form-row">
              <label htmlFor="timezone">Timezone</label>
              <input id="timezone" name="timezone" type="text" defaultValue="America/New_York" />
            </div>
            <div className="form-row">
              <label htmlFor="notes">Notes</label>
              <textarea id="notes" name="notes" />
            </div>
            <div className="actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Create Customer'}
              </button>
              <a href="/admin/customers" className="btn btn-secondary">Cancel</a>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
