/**
 * Vercel Serverless Function — THE single outbound email sender.
 * POST /api/dispatch-email
 * Body: { pendingId?, to, subject, html, replyTo? }
 *
 * This is the ONLY file in the codebase that talks to Resend. It is reachable
 * ONLY from the admin approve-AND-edit gate (AdminCommunications.handleApproveEmail).
 * Every other endpoint queues to `pending_emails` via api/_pendingEmail.js and
 * never sends. Do NOT add a Resend call anywhere else — the launch invariant is
 * that `grep -rn "sendEmail(" api/` matches only this file.
 */

import { isRateLimited } from './_rateLimit.js';

const RESEND_URL = 'https://api.resend.com/emails';
const FROM_NAME  = 'NextClass';
const FROM_ADDR  = process.env.RESEND_FROM || 'onboarding@resend.dev';
const FROM       = `${FROM_NAME} <${FROM_ADDR}>`;

async function sendEmail(to, subject, html, replyTo) {
    const key = process.env.RESEND_API_KEY;
    if (!key) { console.warn('[Resend] RESEND_API_KEY not set'); return { skipped: true }; }
    const body = { from: FROM, to: [to], subject, html };
    if (replyTo) body.reply_to = replyTo;
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

    const { pendingId, to, subject, html, replyTo } = req.body ?? {};
    if (!to)   return res.status(400).json({ error: 'Missing recipient (to)' });
    if (!html) return res.status(400).json({ error: 'Missing email body (html)' });

    try {
        const data = await sendEmail(to, subject || '', html, replyTo);
        if (data?.skipped) {
            return res.status(200).json({ sent: false, skipped: true, pendingId: pendingId || null });
        }
        return res.status(200).json({ sent: true, id: data?.id, pendingId: pendingId || null });
    } catch (err) {
        console.error('[dispatch-email]', err);
        return res.status(500).json({ error: String(err) });
    }
}
