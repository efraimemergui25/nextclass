/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════════════════
   NEXTCLASS ADMIN — LIQUID-GLASS DESIGN TOKENS  (Heaven language, light-only)
   ───────────────────────────────────────────────────────────────────────────────
   Single source of truth for the admin portal's visual system. Page agents should
   import from here so every screen feels like ONE premium system — no stray radii,
   shadows, or colors.

       import { PALETTE, DOMAIN_ACCENTS, accentFor, GLASS, RADIUS,
                SHADOW, SPRING, EASE, GRADIENT, hexA, glow, accentSurface }
         from '../theme/tokens';

   Everything is a plain JS value (inline-style ready). CSS utility twins live in
   ./glass.css  (classes prefixed  nc-* ).
   ═══════════════════════════════════════════════════════════════════════════════ */

/* ─── Brand palette (Apple system-color derived) ─────────────────────────────── */
export const PALETTE = {
    azure:   '#007AFF',
    blue:    '#0A84FF',
    indigo:  '#5AC8FA',
    purple:  '#0A84FF',
    violet:  '#0A84FF',
    pink:    '#FF375F',
    rose:    '#FF2D55',
    coral:   '#FF453A',
    red:     '#FF3B30',
    orange:  '#FF9500',
    gold:    '#FF9F0A',
    amber:   '#FFB340',
    brown:   '#AC8E68',
    mint:    '#00C7BE',
    teal:    '#5AC8FA',
    cyan:    '#32ADE6',
    sky:     '#64D2FF',
    seafoam: '#30B0C7',
    green:   '#34C759',
    emerald: '#30D158',
    graphite:'#8E8E93',

    // Neutrals / ink
    ink:      '#1D1D1F',
    ink2:     '#3C3C43',
    muted:    '#86868B',
    faint:    '#AEAEB2',
    hairline: 'rgba(0,0,0,0.06)',
};

/* ─── COLOR-CODED MODULES — one fixed accent per admin domain ─────────────────
   Keyed by the last path segment of /admin/<key>. Page agents: pick your page's
   accent via  accentFor(pathname)  or  DOMAIN_ACCENTS[key]  and reuse it for the
   page icon, KPI color, section glow and badges.  ★ = pinned by spec.          */
// RESTRAINED BRAND SYSTEM (revised): one cohesive brand accent (azure) across the
// whole admin — no per-domain rainbow. Color now carries MEANING only (see
// STATUS_TONES for success/warning/danger/neutral). Emphasis uses the azure→indigo
// GRADIENT.signature. Neutral canvas + whitespace + hierarchy do the work.
const BRAND = '#007AFF';
export const DOMAIN_ACCENTS = {
    dashboard: BRAND, orders: BRAND, products: BRAND, inventory: BRAND,
    customers: BRAND, users: BRAND, analytics: BRAND, marketing: BRAND,
    content: BRAND, fulfillment: BRAND, suppliers: BRAND, community: BRAND,
    qa: BRAND, communications: BRAND, media: BRAND, magazine: BRAND,
    ocr: BRAND, vault: BRAND, integrations: BRAND, security: BRAND, settings: BRAND,
};
export const MODULE_ACCENTS = DOMAIN_ACCENTS; // alias

/** Resolve the accent for a route/pathname or a bare domain key. */
export function accentFor(input, fallback = PALETTE.azure) {
    if (!input) return fallback;
    const key = String(input).replace(/^\/?admin\//, '').split('/')[0].toLowerCase();
    return DOMAIN_ACCENTS[key] || fallback;
}

/* ─── Signature gradients ────────────────────────────────────────────────────── */
export const GRADIENT = {
    signature: 'linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%)',       // azure → indigo
    aurora:    'linear-gradient(135deg, #007AFF 0%, #0A84FF 55%, #FF375F 100%)',
    ink:       'linear-gradient(135deg, #1D1D1F 0%, #3C3C43 100%)',
};

/** azure→indigo style diagonal gradient tinted toward an arbitrary accent. */
export function accentGradient(hex, from = '#007AFF') {
    return `linear-gradient(135deg, ${from} 0%, ${hex} 100%)`;
}

/* ─── Radius scale ───────────────────────────────────────────────────────────── */
export const RADIUS = {
    button: 12,
    input:  12,
    chip:   10,
    sm:     14,
    smCard: 16,
    md:     18,
    card:   20,
    cardLg: 22,
    panel:  24,
    kpi:    24,
    hero:   26,
    sheet:  28,
    sheetLg:32,
    pill:   9999,
};

/* ─── Soft, diffuse shadow scale (never harsh) ───────────────────────────────── */
export const SHADOW = {
    xs:  '0 1px 2px rgba(0,0,0,0.04)',
    sm:  '0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
    md:  '0 4px 20px rgba(0,0,0,0.07), 0 2px 6px rgba(0,0,0,0.04)',
    lg:  '0 8px 40px rgba(0,0,0,0.09), 0 3px 10px rgba(0,0,0,0.05)',
    xl:  '0 16px 60px rgba(0,0,0,0.10), 0 6px 20px rgba(0,0,0,0.06)',
    xxl: '0 28px 80px rgba(0,0,0,0.12), 0 10px 28px rgba(0,0,0,0.07)',
    // Inset top specular highlight ("glass edge")
    specular:  'inset 0 1.5px 0 rgba(255,255,255,1)',
    specular2: 'inset 0 2px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(0,0,0,0.03)',
};

/* ─── Liquid-glass surface recipes (inline-style ready) ──────────────────────── */
const BLUR = { sm: 16, md: 32, lg: 48, xl: 64, xxl: 80 };

export const GLASS = {
    /* Standard card — the workhorse */
    base: {
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: `blur(${BLUR.md}px) saturate(200%)`,
        WebkitBackdropFilter: `blur(${BLUR.md}px) saturate(200%)`,
        border: '1.5px solid rgba(255,255,255,0.9)',
        boxShadow: `${SHADOW.md}, ${SHADOW.specular}`,
    },
    /* Elevated — panels, popovers */
    elevated: {
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: `blur(${BLUR.xl}px) saturate(220%)`,
        WebkitBackdropFilter: `blur(${BLUR.xl}px) saturate(220%)`,
        border: '1.5px solid rgba(255,255,255,0.94)',
        boxShadow: `${SHADOW.lg}, ${SHADOW.specular}`,
    },
    /* Sheet — modals, overlays (deepest) */
    sheet: {
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: `blur(${BLUR.xxl}px) saturate(240%)`,
        WebkitBackdropFilter: `blur(${BLUR.xxl}px) saturate(240%)`,
        border: '1.5px solid rgba(255,255,255,0.95)',
        boxShadow: `${SHADOW.xxl}, ${SHADOW.specular2}`,
    },
    /* Frosted — subtle chrome (topbar, chips) */
    frosted: {
        background: 'rgba(252,252,255,0.7)',
        backdropFilter: `blur(${BLUR.sm}px) saturate(180%)`,
        WebkitBackdropFilter: `blur(${BLUR.sm}px) saturate(180%)`,
        border: '1px solid rgba(255,255,255,0.7)',
        boxShadow: `${SHADOW.sm}, ${SHADOW.specular}`,
    },
};

/* ─── Easings ────────────────────────────────────────────────────────────────── */
export const EASE = {
    snap:   [0.22, 1, 0.36, 1],
    spring: [0.34, 1.56, 0.64, 1],
    expo:   [0.16, 1, 0.3, 1],
    inOut:  [0.4, 0, 0.2, 1],
    // string forms for CSS transitions
    snapCss:   'cubic-bezier(0.22,1,0.36,1)',
    springCss: 'cubic-bezier(0.34,1.56,0.64,1)',
    expoCss:   'cubic-bezier(0.16,1,0.3,1)',
};

/* ─── framer-motion spring presets + micro-interaction constants ─────────────── */
export const SPRING = {
    soft:   { type: 'spring', stiffness: 300, damping: 30 },
    snappy: { type: 'spring', stiffness: 420, damping: 32 },
    gentle: { type: 'spring', stiffness: 220, damping: 26 },
    pill:   { type: 'spring', stiffness: 460, damping: 38 }, // shared-element active pill
    pop:    { type: 'spring', stiffness: 600, damping: 22 }, // badges
};
export const TAP        = { scale: 0.96 };          // whileTap
export const TAP_SOFT   = { scale: 0.98 };
export const HOVER_LIFT = { y: -3 };                // whileHover translateY(-3px)

/* ─── Color helpers ──────────────────────────────────────────────────────────── */
/** hex + 0..1 alpha → rgba() string. Accepts #rgb, #rrggbb. */
export function hexA(hex, a = 1) {
    if (!hex) return `rgba(0,0,0,${a})`;
    if (hex.startsWith('rgb')) return hex;
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return `rgba(${r},${g},${b},${a})`;
}

/** Soft colored outer glow — the signature Heaven halo. */
export function glow(hex, strength = 0.3, spread = 24) {
    return `0 0 ${spread}px ${hexA(hex, strength)}`;
}

/** drop-shadow filter form (for icons / SVG). */
export function glowFilter(hex, strength = 0.3, spread = 20) {
    return `drop-shadow(0 0 ${spread}px ${hexA(hex, strength)})`;
}

/** A ready-to-spread accent-tinted glass surface for cards / KPIs. */
export function accentSurface(hex, { radius = RADIUS.kpi } = {}) {
    return {
        background: `linear-gradient(145deg, ${hexA(hex, 0.10)} 0%, rgba(255,255,255,0.97) 45%, #fff 100%)`,
        border: `1px solid ${hexA(hex, 0.22)}`,
        borderRadius: radius,
        boxShadow: `0 4px 24px ${hexA(hex, 0.12)}, ${SHADOW.specular}, inset 0 -1px 0 rgba(0,0,0,0.025)`,
    };
}

/* ─── Status → color mapping (badges) ────────────────────────────────────────── */
export const STATUS_TONES = {
    success: { fg: '#1A8C40', bg: 'rgba(52,199,89,0.12)',  dot: '#34C759' },
    warning: { fg: '#B86A00', bg: 'rgba(255,149,0,0.12)',  dot: '#FF9500' },
    danger:  { fg: '#C0392B', bg: 'rgba(255,59,48,0.12)',  dot: '#FF3B30' },
    info:    { fg: '#005EC4', bg: 'rgba(0,122,255,0.12)',  dot: '#007AFF' },
    neutral: { fg: '#6E6E73', bg: 'rgba(0,0,0,0.05)',      dot: '#AEAEB2' },
};

/* Semantic tone → color accessors. Use these EVERYWHERE instead of inline status
   hexes so the whole portal speaks one status-color language. */
export const toneColor = (tone) => (STATUS_TONES[tone] || STATUS_TONES.neutral).dot;
export const toneFg    = (tone) => (STATUS_TONES[tone] || STATUS_TONES.neutral).fg;
export const toneBg    = (tone) => (STATUS_TONES[tone] || STATUS_TONES.neutral).bg;

export default {
    PALETTE, DOMAIN_ACCENTS, MODULE_ACCENTS, accentFor,
    GRADIENT, accentGradient, RADIUS, SHADOW, GLASS, EASE, SPRING,
    TAP, TAP_SOFT, HOVER_LIFT, hexA, glow, glowFilter, accentSurface, STATUS_TONES,
};
