import { DigestEmailPayload } from '@/types';

function formatCurrency(amount?: number): string {
  if (amount === undefined || amount === null) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(date?: Date): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function sourceLabel(sourceType: string): string {
  return sourceType === 'SAM' ? 'SAM.gov' : sourceType === 'GRANTS' ? 'Grants.gov' : sourceType;
}

export function buildDigestHtml(payload: DigestEmailPayload): string {
  const { customer, opportunities, periodStart, periodEnd } = payload;
  const periodStr = `${formatDate(periodStart)} – ${formatDate(periodEnd)}`;

  const oppRows = opportunities
    .map(
      (opp) => `
    <tr style="border-bottom:1px solid #e5e7eb;">
      <td style="padding:16px 0;">
        <div style="font-weight:600;font-size:15px;color:#111827;">
          ${opp.url ? `<a href="${opp.url}" style="color:#2563eb;text-decoration:none;">${opp.title}</a>` : opp.title}
        </div>
        <div style="font-size:13px;color:#6b7280;margin-top:4px;">
          <span style="background:#f3f4f6;padding:2px 8px;border-radius:4px;">${sourceLabel(opp.sourceType)}</span>
          ${opp.agencyName ? `&nbsp;·&nbsp;${opp.agencyName}` : ''}
        </div>
        <div style="font-size:13px;color:#374151;margin-top:8px;">
          <strong>Due:</strong> ${formatDate(opp.responseDate)} &nbsp;·&nbsp;
          <strong>Award:</strong> ${formatCurrency(opp.awardFloor)} – ${formatCurrency(opp.awardCeiling)} &nbsp;·&nbsp;
          <strong>Score:</strong> ${Math.round(opp.totalScore)}/100
        </div>
        ${
          opp.matchReasons.length > 0
            ? `<div style="font-size:12px;color:#059669;margin-top:6px;">✓ ${opp.matchReasons.join(' · ')}</div>`
            : ''
        }
      </td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:24px 16px;">
    <div style="background:#ffffff;border-radius:8px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="border-bottom:2px solid #2563eb;padding-bottom:16px;margin-bottom:24px;">
        <h1 style="margin:0;font-size:22px;color:#111827;">📡 Funding Radar Digest</h1>
        <p style="margin:4px 0 0;font-size:14px;color:#6b7280;">Week of ${periodStr}</p>
      </div>
      <p style="color:#374151;">Hello ${customer.contactName},</p>
      <p style="color:#374151;">Here are <strong>${opportunities.length}</strong> funding opportunities that match your profile for <strong>${customer.organizationName}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;">
        ${oppRows}
      </table>
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center;">
        <p>You're receiving this because you're subscribed to Funding Radar weekly digests.<br>
        Contact your administrator to update your preferences.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function buildDigestText(payload: DigestEmailPayload): string {
  const { customer, opportunities, periodStart, periodEnd } = payload;
  const periodStr = `${formatDate(periodStart)} – ${formatDate(periodEnd)}`;

  const lines = [
    `FUNDING RADAR WEEKLY DIGEST`,
    `Week of ${periodStr}`,
    ``,
    `Hello ${customer.contactName},`,
    ``,
    `Here are ${opportunities.length} funding opportunities matching ${customer.organizationName}:`,
    ``,
    `---`,
  ];

  for (const opp of opportunities) {
    lines.push(`${opp.title}`);
    lines.push(`Source: ${sourceLabel(opp.sourceType)}${opp.agencyName ? ` | Agency: ${opp.agencyName}` : ''}`);
    lines.push(`Due: ${formatDate(opp.responseDate)} | Award: ${formatCurrency(opp.awardFloor)} – ${formatCurrency(opp.awardCeiling)} | Score: ${Math.round(opp.totalScore)}/100`);
    if (opp.matchReasons.length > 0) lines.push(`Why it matches: ${opp.matchReasons.join(', ')}`);
    if (opp.url) lines.push(`Link: ${opp.url}`);
    lines.push(`---`);
  }

  lines.push(``, `To update your preferences, contact your administrator.`);
  return lines.join('\n');
}
