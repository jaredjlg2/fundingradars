import { config } from '@/lib/config';
import { logger } from '@/lib/logging';

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!config.resendApiKey) {
    logger.info('DEV MODE: Email not sent (no RESEND_API_KEY). Logging content.', {
      to,
      subject,
      textPreview: text.slice(0, 200),
    });
    return { success: true, id: 'dev-mode-no-send' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.emailFrom,
        to,
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error('Resend API error', { status: response.status, body: errorBody });
      return { success: false, error: `HTTP ${response.status}: ${errorBody}` };
    }

    const data = (await response.json()) as { id: string };
    return { success: true, id: data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Email send failed', { error: message });
    return { success: false, error: message };
  }
}
