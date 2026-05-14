// Shared in-memory rate limiter (resets on cold start — first line of defence)
const map = new Map();

/**
 * @param {string} ip
 * @param {{ max?: number, windowMs?: number }} opts
 * @returns {boolean} true if the request should be blocked
 */
export function isRateLimited(ip, { max = 20, windowMs = 60_000 } = {}) {
    const now = Date.now();
    const entry = map.get(ip) || { count: 0, reset: now + windowMs };
    if (now > entry.reset) { entry.count = 0; entry.reset = now + windowMs; }
    entry.count++;
    map.set(ip, entry);
    return entry.count > max;
}
