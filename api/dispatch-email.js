/**
 * Vercel Serverless Function — THE single outbound email sender.
 * POST /api/dispatch-email
 * Body: { pendingId?, to, subject, html, replyTo? }
 *
 * This is the ONLY file in the codebase that talks to Resend. It is reachable from
 * exactly three HUMAN-triggered surfaces — each behind an explicit click, never a
 * timer/trigger:
 *   1. AdminCommunications.handleApproveEmail — the approve-AND-edit queue.
 *   2. AdminOrderHub.doSendEmail — the stage-email preview→edit→send modal.
 *   3. InvoiceModal.sendToCustomer — emailing an issued invoice.
 * (2) and (3) also mirror a `status:'sent'` record into `pending_emails` so every
 * send shows in the unified email history. Every OTHER endpoint only queues to
 * `pending_emails` via api/_pendingEmail.js and never sends. The launch invariant —
 * NOTHING auto-sends — holds: `grep -rn "resend.com" api/` matches only this file,
 * and no code path here runs without a human action.
 */

import { isRateLimited } from './_rateLimit.js';

const RESEND_URL = 'https://api.resend.com/emails';
const FROM_NAME  = 'NextClass';
const FROM_ADDR  = process.env.RESEND_FROM || 'onboarding@resend.dev';
const FROM       = `${FROM_NAME} <${FROM_ADDR}>`;

async function sendEmail(to, subject, html, replyTo, attachments) {
    const key = process.env.RESEND_API_KEY;
    if (!key) { console.warn('[Resend] RESEND_API_KEY not set'); return { skipped: true }; }
    const body = { from: FROM, to: [to], subject, html };
    if (replyTo) body.reply_to = replyTo;
    if (Array.isArray(attachments) && attachments.length) body.attachments = attachments;
    const res = await fetch(RESEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(JSON.stringify(data));
    console.log('[Resend] Sent to:', to, '| id:', data.id);
    return data;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
    if (isRateLimited(ip, { max: 30, windowMs: 60_000 })) {
        return res.status(429).json({ error: 'Too many requests' });
    }

    const { pendingId, to, subject, html, replyTo, attachments } = req.body ?? {};
    if (!to)   return res.status(400).json({ error: 'Missing recipient (to)' });
    if (!html) return res.status(400).json({ error: 'Missing email body (html)' });

    try {
        const data = await sendEmail(to, subject || '', html, replyTo, attachments);
        if (data?.skipped) {
            return res.status(200).json({ sent: false, skipped: true, pendingId: pendingId || null });
        }
        return res.status(200).json({ sent: true, id: data?.id, pendingId: pendingId || null });
    } catch (err) {
        console.error('[dispatch-email]', err);
        return res.status(500).json({ error: String(err) });
    }
}
