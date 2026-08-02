import 'server-only';
import { Resend } from 'resend';
import type { IDemoRequest } from '@/database';

/**
 * Requires:
 *   npm install resend
 *   RESEND_API_KEY          - your Resend API key
 *   DEMO_REQUEST_TO_EMAIL   - inbox that should receive new-lead notifications (e.g. sales@sungurasmart.com)
 *   DEMO_REQUEST_FROM_EMAIL - a verified sending address/domain in Resend (e.g. notifications@sungurasmart.com)
 *
 * Both sends are best-effort: failures here should never block saving the
 * lead to the database. Callers should wrap this in try/catch and log.
 */

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FARM_SIZE_LABELS: Record<string, string> = {
  under_50: 'Under 50 rabbits',
  '50_200': '50 - 200 rabbits',
  '200_500': '200 - 500 rabbits',
  over_500: '500+ rabbits',
};

export async function sendDemoRequestNotifications(lead: IDemoRequest): Promise<void> {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping demo request emails.');
    return;
  }

  const toEmail = process.env.DEMO_REQUEST_TO_EMAIL;
  const fromEmail = process.env.DEMO_REQUEST_FROM_EMAIL;

  if (!toEmail || !fromEmail) {
    console.warn('[email] DEMO_REQUEST_TO_EMAIL / DEMO_REQUEST_FROM_EMAIL not set — skipping demo request emails.');
    return;
  }

  const farmSizeLabel = lead.farmSize ? FARM_SIZE_LABELS[lead.farmSize] ?? lead.farmSize : 'Not specified';

  // Internal notification to the sales inbox.
  await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    subject: `New demo request — ${lead.name}${lead.farmName ? ` (${lead.farmName})` : ''}`,
    text: [
      `Name: ${lead.name}`,
      `Email: ${lead.email}`,
      lead.phone ? `Phone: ${lead.phone}` : null,
      lead.farmName ? `Farm: ${lead.farmName}` : null,
      `Farm size: ${farmSizeLabel}`,
      lead.message ? `Message:\n${lead.message}` : null,
      `Source: ${lead.source}`,
    ]
      .filter(Boolean)
      .join('\n'),
  });

  // Confirmation to the prospect.
  await resend.emails.send({
    from: fromEmail,
    to: lead.email,
    subject: 'We got your demo request — SunguraSmart',
    text: `Hi ${lead.name},\n\nThanks for reaching out about SunguraSmart. Someone from our team will contact you within one business day to set up a time.\n\nIn the meantime, feel free to reply to this email with any questions.\n\n— The SunguraSmart team`,
  });
}
