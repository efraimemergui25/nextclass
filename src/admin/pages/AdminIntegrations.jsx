/* eslint-disable */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart2, Zap, TrendingUp, Users, MessageCircle, Mail,
    Bot, Link2, Globe, RefreshCw, Settings, ExternalLink,
    CheckCircle, XCircle, AlertCircle, Database, Package,
    Server, Building2, Clock, Info, ChevronLeft, ShieldCheck,
} from 'lucide-react';
import { AdminSectionHeader } from '../components/AdminComponents';

// ── Design tokens ─────────────────────────────────────────────────────────────
const GLASS = {
    background: 'rgba(255,255,255,0.88)',
    backdropFilter: 'blur(28px) saturate(200%)',
    WebkitBackdropFilter: 'blur(28px) saturate(200%)',
    border: '1px solid rgba(255,255,255,0.75)',
    boxShadow: '0 4px 28px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
    borderRadius: 22,
};
const GLASS_INSET = {
    background: 'rgba(0,0,0,0.025)',
    border: '1px solid rgba(0,0,0,0.06)',
    borderRadius: 14,
};

// ── Analytics platform links ───────────────────────────────────────────────────
const ANALYTICS_LINKS = [
    {
        label: 'Vercel Analytics', desc: 'תנועה, דפים, מדינות',
        Icon: BarChart2, gradient: 'linear-gradient(135deg,#000,#333)', color: '#1D1D1F',
        href: 'https://vercel.com/efraimemergui25-4034s-projects/nextclass-v4-living',
    },
    {
        label: 'Speed Insights', desc: 'LCP, CLS, FID, TTFB',
        Icon: Zap, gradient: 'linear-gradient(135deg,#FF9500,#FF6B00)', color: '#FF9500',
        href: 'https://vercel.com/efraimemergui25-4034s-projects/nextclass-v4-living',
    },
    {
        label: 'Google Analytics', desc: 'קהלים, קמפיינים, המרות',
        Icon: TrendingUp, gradient: 'linear-gradient(135deg,#34C759,#248A3D)', color: '#34C759',
        href: 'https://analytics.google.com',
    },
    {
        label: 'HubSpot CRM', desc: 'לידים, עסקאות, פייפליין',
        Icon: Users, gradient: 'linear-gradient(135deg,#FF7A59,#FF5C35)', color: '#FF7A59',
        href: 'https://app-eu1.hubspot.com',
    },
    {
        label: 'Crisp Inbox', desc: 'שיחות לייב עם לקוחות',
        Icon: MessageCircle, gradient: 'linear-gradient(135deg,#1972F5,#0055D4)', color: '#1972F5',
        href: 'https://app.crisp.chat',
    },
    {
        label: 'Resend', desc: 'מיילים שנשלחו, לוגים',
        Icon: Mail, gradient: 'linear-gradient(135deg,#007AFF,#0055D4)', color: '#007AFF',
        href: 'https://resend.com/emails',
    },
];

// ── Services status config ────────────────────────────────────────────────────
const SERVICES = [
    { key: 'groq',    label: 'AI Concierge',    Icon: Bot,            color: '#5856D6', desc: 'עוזר חכם + המלצות',    href: 'https://console.groq.com',        statusCheck: () => true },
    { key: 'resend',  label: 'Resend Email',     Icon: Mail,           color: '#007AFF', desc: 'מיילי אישור',          href: 'https://resend.com/emails',       statusCheck: () => true },
    { key: 'hubspot', label: 'HubSpot CRM',      Icon: Users,          color: '#FF7A59', desc: 'ניהול לידים',          href: 'https://app-eu1.hubspot.com',     statusCheck: null },
    { key: 'ga',      label: 'Google Analytics', Icon: BarChart2,      color: '#34C759', desc: 'מעקב תנועה',           href: 'https://analytics.google.com',    statusCheck: () => !!(import.meta.env.VITE_GA_ID?.startsWith('G-')) },
    { key: 'crisp',   label: 'Crisp Chat',       Icon: MessageCircle,  color: '#1972F5', desc: 'צ׳אט לייב',           href: 'https://app.crisp.chat',          statusCheck: () => !!(import.meta.env.VITE_CRISP_ID) },
    { key: 'vercel',  label: 'Vercel',           Icon: Server,         color: '#1D1D1F', desc: 'Deploy & Analytics',   href: 'https://vercel.com',              statusCheck: () => true },
    { key: 'firebase',label: 'Firebase',         Icon: Database,       color: '#FF6D00', desc: 'DB + Storage',         href: 'https://console.firebase.google.com', statusCheck: () => true },
    { key: 'namecheap',label: 'Namecheap',       Icon: Globe,          color: '#DE3723', desc: 'דומיין + DNS',         href: 'https://www.namecheap.com',       statusCheck: () => false },
];

// ── CRM data hook ─────────────────────────────────────────────────────────────
function useCRMStats() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [ts, setTs] = useState(0);
    useEffect(() => {
        setLoading(true);
        fetch('/api/hubspot-stats')
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [ts]);
    return { data, loading, refetch: () => setTs(Date.now()) };
}

// ── ServiceCard ───────────────────────────────────────────────────────────────
function ServiceCard({ service, isActive, i }) {
    const { Icon, label, desc, color, href } = service;
    return (
        <motion.a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -3, scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="flex flex-col items-center gap-2 p-3.5 rounded-2xl text-center cursor-pointer relative group"
            style={{
                ...GLASS_INSET,
                background: isActive ? `${color}0D` : 'rgba(0,0,0,0.025)',
                border: `1px solid ${isActive ? color + '28' : 'rgba(0,0,0,0.06)'}`,
                textDecoration: 'none',
                transition: 'box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 6px 20px ${color}22`; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
        >
            <div className="relative">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: `${color}18`, border: `1px solid ${color}28` }}>
                    <Icon className="w-5 h-5" style={{ color }} strokeWidth={1.8} />
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isActive ? 'bg-[#34C759]' : 'bg-[#C7C7CC]'}`} />
            </div>
            <div>
                <p className="text-[10px] font-black text-[#1D1D1F] leading-tight">{label}</p>
                <p className="text-[9px] text-[#AEAEB2] mt-0.5 leading-snug">{desc}</p>
            </div>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${isActive ? 'text-[#34C759] bg-[#34C759]/10' : 'text-[#AEAEB2] bg-black/05'}`}>
                {isActive ? 'פעיל' : 'לא מחובר'}
            </span>
        </motion.a>
    );
}

// ── AnalyticsLinks ────────────────────────────────────────────────────────────
function AnalyticsLinks() {
    return (
        <div style={GLASS} className="p-5">
            <div className="h-[3px] w-full rounded-full mb-5"
                style={{ background: 'linear-gradient(90deg,#007AFF,#34C759,#FF9500)' }} />
            <div className="flex items-center justify-between mb-5">
                <div className="text-right">
                    <h3 className="font-black text-[#1D1D1F] text-[15px] tracking-tight">כלי אנליטיקס ודשבורדים</h3>
                    <p className="text-[#AEAEB2] text-[11px] mt-0.5">גישה מהירה לכל הפלטפורמות החיצוניות</p>
                </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {ANALYTICS_LINKS.map((link, i) => {
                    const { Icon } = link;
                    return (
                        <motion.a
                            key={link.label}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            whileHover={{ y: -3, scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="flex flex-col items-center gap-2.5 p-3 rounded-2xl text-center group"
                            style={{ ...GLASS_INSET, textDecoration: 'none', transition: 'box-shadow 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 6px 20px ${link.color}25`; }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                        >
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm"
                                style={{ background: link.gradient }}>
                                <Icon className="w-5 h-5 text-white" strokeWidth={1.8} />
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-[#1D1D1F] leading-tight">{link.label}</p>
                                <p className="text-[9px] text-[#AEAEB2] mt-0.5 leading-snug">{link.desc}</p>
                            </div>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ color: link.color, background: `${link.color}15` }}>
                                פתח
                            </span>
                        </motion.a>
                    );
                })}
            </div>
        </div>
    );
}

// ── CRM Pipeline ──────────────────────────────────────────────────────────────
function CRMPipeline({ data, loading, refetch }) {
    if (loading) {
        return (
            <div style={GLASS} className="p-5">
                <div className="h-[3px] w-full rounded-full mb-5"
                    style={{ background: 'linear-gradient(90deg,#FF7A59,#FF9500)' }} />
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="font-black text-[#1D1D1F] text-[15px]">CRM Pipeline</h3>
                        <p className="text-[#AEAEB2] text-[11px] mt-0.5">HubSpot · טוען...</p>
                    </div>
                    <RefreshCw className="w-4 h-4 text-[#AEAEB2] animate-spin" />
                </div>
                <div className="flex items-center justify-center h-32 gap-3">
                    {[0,1,2].map(i => (
                        <motion.div key={i} className="w-2.5 h-2.5 rounded-full bg-[#FF7A59]"
                            animate={{ scale: [1,1.5,1], opacity: [0.4,1,0.4] }}
                            transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }} />
                    ))}
                </div>
            </div>
        );
    }

    if (!data?.configured) {
        return (
            <div style={GLASS} className="p-5">
                <div className="h-[3px] w-full rounded-full mb-5"
                    style={{ background: 'linear-gradient(90deg,#FF7A59,#FF9500)' }} />
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-black text-[#1D1D1F] text-[15px]">CRM Pipeline</h3>
                        <p className="text-[#AEAEB2] text-[11px] mt-0.5">HubSpot · לא מחובר</p>
                    </div>
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#FF3B30] bg-[#FF3B30]/08 px-2.5 py-1 rounded-full">
                        <XCircle className="w-3.5 h-3.5" /> לא פעיל
                    </span>
                </div>

                <div className="flex flex-col items-center justify-center py-6 gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg,#FF7A59,#FF5C35)' }}>
                        <Users className="w-7 h-7 text-white" strokeWidth={1.5} />
                    </div>
                    <div className="text-center">
                        <p className="text-[#1D1D1F] font-bold text-sm">HUBSPOT_API_KEY לא מוגדר</p>
                        <p className="text-[#AEAEB2] text-xs mt-1">הוסף את המפתח ב-Vercel כדי לסנכרן לידים אוטומטית</p>
                    </div>

                    <div className="w-full rounded-xl p-4 text-right"
                        style={{ background: 'rgba(255,122,89,0.06)', border: '1px solid rgba(255,122,89,0.18)' }}>
                        <p className="text-[11px] font-black text-[#FF7A59] mb-2.5 flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 shrink-0" /> הוראות חיבור
                        </p>
                        <ol className="text-[11px] text-[#6E6E73] space-y-1.5 list-decimal list-inside">
                            <li>פתח את הגדרות Vercel לפרויקט</li>
                            <li>נווט אל Settings → Environment Variables</li>
                            <li>הוסף: <code className="font-mono bg-black/06 px-1 py-0.5 rounded text-[10px]">HUBSPOT_API_KEY</code></li>
                            <li>ערך: Private App token מ-HubSpot</li>
                        </ol>
                        <a
                            href="https://vercel.com/efraimemergui25-4034s-projects/nextclass-v4-living/settings/environment-variables"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-black text-white px-3 py-2 rounded-xl"
                            style={{ background: 'linear-gradient(135deg,#FF7A59,#FF5C35)', textDecoration: 'none' }}
                        >
                            <Settings className="w-3.5 h-3.5" /> הגדר ב-Vercel <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    const contacts = data.contacts;
    const deals = data.deals;

    return (
        <div style={GLASS} className="p-5">
            <div className="h-[3px] w-full rounded-full mb-5"
                style={{ background: 'linear-gradient(90deg,#FF7A59,#FF9500)' }} />
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="font-black text-[#1D1D1F] text-[15px]">CRM Pipeline</h3>
                    <p className="text-[#AEAEB2] text-[11px] mt-0.5">
                        HubSpot · {contacts?.total || 0} לידים · {deals?.total || 0} עסקאות
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={refetch}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-[#AEAEB2] hover:text-[#1D1D1F] hover:bg-black/06 transition-all">
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <a href="https://app-eu1.hubspot.com" target="_blank" rel="noopener noreferrer"
                        className="text-[11px] font-black text-[#FF7A59] flex items-center gap-1 hover:underline"
                        style={{ textDecoration: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                        HubSpot <ChevronLeft className="w-3 h-3" />
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                    { label: 'סה״כ לידים',    value: contacts?.total || 0,                              color: '#FF7A59', Icon: Users },
                    { label: 'עסקאות פתוחות', value: deals?.open || 0,                                  color: '#FF9500', Icon: TrendingUp },
                    { label: 'שווי פייפליין', value: `₪${(deals?.pipelineValue || 0).toLocaleString()}`, color: '#34C759', Icon: ShieldCheck },
                ].map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.07 }}
                        className="p-3 rounded-2xl text-center"
                        style={{ background: `${stat.color}10`, border: `1px solid ${stat.color}20` }}>
                        <stat.Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: stat.color }} strokeWidth={2} />
                        <p className="font-black text-[15px] text-[#1D1D1F]">{stat.value}</p>
                        <p className="text-[9px] text-[#AEAEB2] font-bold mt-0.5">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {contacts?.recent?.length > 0 && (
                    <div>
                        <p className="text-[10px] font-black text-[#86868B] tracking-widest mb-2">לידים אחרונים</p>
                        <div className="space-y-1.5">
                            {contacts.recent.slice(0, 5).map((c, i) => (
                                <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex items-center gap-2.5 py-2 border-b border-black/04 last:border-0">
                                    <div className="w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-black text-white shrink-0"
                                        style={{ background: 'linear-gradient(135deg,#FF7A59,#FF9500)' }}>
                                        {(c.name || c.email || '?')[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0 text-right">
                                        <p className="text-[11px] font-bold text-[#1D1D1F] truncate">{c.name || 'ללא שם'}</p>
                                        <p className="text-[9px] text-[#AEAEB2] truncate">{c.company || c.email || '—'}</p>
                                    </div>
                                    <span className="w-2 h-2 rounded-full bg-[#34C759] shrink-0" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
                {deals?.recent?.length > 0 && (
                    <div>
                        <p className="text-[10px] font-black text-[#86868B] tracking-widest mb-2">עסקאות אחרונות</p>
                        <div className="space-y-1.5">
                            {deals.recent.slice(0, 5).map((d, i) => (
                                <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.15 + i * 0.05 }}
                                    className="flex items-center justify-between py-2 border-b border-black/04 last:border-0">
                                    <span className="text-[11px] font-black text-[#FF9500]">₪{d.amount?.toLocaleString?.() || 0}</span>
                                    <span className="text-[11px] text-[#1D1D1F] font-medium text-right flex-1 mx-2 truncate">{d.name}</span>
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#FF9500]/10 text-[#FF9500] shrink-0">פתוח</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── GeneralInfo ───────────────────────────────────────────────────────────────
function GeneralInfo() {
    const rows = [
        { label: 'דומיין ראשי',      value: 'getnextclass.com',          Icon: Globe,      color: '#007AFF' },
        { label: 'רשם דומיין',       value: 'Namecheap',                 Icon: Building2,  color: '#DE3723' },
        { label: 'Firebase Project', value: 'nextclass-v4-living',       Icon: Database,   color: '#FF6D00' },
        { label: 'Vercel Project',   value: 'nextclass-v4-living',       Icon: Server,     color: '#1D1D1F' },
        { label: 'אזור HubSpot',     value: 'EU1 (אירופה)',              Icon: Globe,      color: '#FF7A59' },
        { label: 'Email Service',    value: 'Resend (onboarding@)',       Icon: Mail,       color: '#007AFF' },
    ];

    return (
        <div style={GLASS} className="p-5">
            <div className="h-[3px] w-full rounded-full mb-5"
                style={{ background: 'linear-gradient(90deg,#5856D6,#007AFF)' }} />
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="font-black text-[#1D1D1F] text-[15px]">מידע תשתית</h3>
                    <p className="text-[#AEAEB2] text-[11px] mt-0.5">פרטי פרויקט ושירותים</p>
                </div>
                <Info className="w-4 h-4 text-[#AEAEB2]" />
            </div>

            <div className="space-y-2">
                {rows.map(({ label, value, Icon, color }, i) => (
                    <motion.div key={label} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center justify-between py-2 px-3 rounded-xl" style={GLASS_INSET}>
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                                <Icon className="w-3.5 h-3.5" style={{ color }} strokeWidth={2} />
                            </div>
                            <span className="text-[12px] font-bold text-[#1D1D1F]">{value}</span>
                        </div>
                        <span className="text-[11px] text-[#86868B] font-medium">{label}</span>
                    </motion.div>
                ))}
            </div>

            <div className="mt-4 flex items-start gap-2.5 p-3 rounded-xl"
                style={{ background: 'rgba(255,149,0,0.06)', border: '1px solid rgba(255,149,0,0.20)' }}>
                <Clock className="w-4 h-4 text-[#FF9500] mt-0.5 shrink-0" />
                <div className="text-right">
                    <p className="text-[11px] font-black text-[#FF9500]">תזכורת חידוש דומיין</p>
                    <p className="text-[11px] text-[#6E6E73] mt-0.5">
                        בדוק את תאריך פקיעת getnextclass.com ב-Namecheap ורנו בזמן.
                    </p>
                    <a href="https://www.namecheap.com" target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-black text-[#FF9500] mt-1.5"
                        style={{ textDecoration: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                        Namecheap → My Domains <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminIntegrations() {
    const { data: crmData, loading: crmLoading, refetch } = useCRMStats();

    const getServiceStatus = (service) => {
        if (service.key === 'hubspot') return !!(crmData?.configured && !crmData?.error);
        if (service.statusCheck) return service.statusCheck();
        return false;
    };

    const activeCount = SERVICES.filter(s => getServiceStatus(s)).length;

    return (
        <div className="space-y-6" dir="rtl">

            <AdminSectionHeader
                title="אינטגרציות ושירותים"
                subtitle="ניהול וניטור כל הפלטפורמות החיצוניות של NextClass"
                action={
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                        style={{ background: 'rgba(52,199,89,0.10)', border: '1px solid rgba(52,199,89,0.22)' }}>
                        <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
                        <span className="text-[12px] font-black text-[#1D1D1F]">{activeCount} / {SERVICES.length} שירותים פעילים</span>
                    </div>
                }
            />

            {/* ── Services grid ─────────────────────────────────────────────── */}
            <div style={GLASS} className="p-5">
                <div className="h-[3px] w-full rounded-full mb-5"
                    style={{ background: 'linear-gradient(90deg,#007AFF,#5856D6,#FF7A59)' }} />
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="font-black text-[#1D1D1F] text-[15px]">סטטוס שירותים</h3>
                        <p className="text-[#AEAEB2] text-[11px] mt-0.5">לחץ על שירות לפתיחתו</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] text-[#AEAEB2] flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#34C759]" /> מחובר
                        </span>
                        <span className="text-[10px] text-[#AEAEB2] flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#C7C7CC]" /> לא מחובר
                        </span>
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                    {SERVICES.map((service, i) => (
                        <ServiceCard key={service.key} service={service} isActive={getServiceStatus(service)} i={i} />
                    ))}
                </div>

                <AnimatePresence>
                    {crmData && !crmData.configured && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 flex items-start gap-3 p-4 rounded-xl"
                            style={{ background: 'rgba(255,122,89,0.06)', border: '1px solid rgba(255,122,89,0.20)' }}
                        >
                            <AlertCircle className="w-5 h-5 text-[#FF7A59] shrink-0 mt-0.5" />
                            <div className="flex-1 text-right">
                                <p className="text-[12px] font-black text-[#FF7A59]">HubSpot CRM לא מחובר</p>
                                <p className="text-[11px] text-[#6E6E73] mt-0.5">
                                    הוסף <code className="font-mono bg-black/06 px-1 rounded text-[10px]">HUBSPOT_API_KEY</code> כמשתנה סביבה ב-Vercel.
                                </p>
                            </div>
                            <a
                                href="https://vercel.com/efraimemergui25-4034s-projects/nextclass-v4-living/settings/environment-variables"
                                target="_blank" rel="noopener noreferrer"
                                className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-black text-white px-3 py-2 rounded-xl"
                                style={{ background: 'linear-gradient(135deg,#FF7A59,#FF5C35)', textDecoration: 'none' }}
                            >
                                <Settings className="w-3.5 h-3.5" /> הגדר עכשיו
                            </a>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Analytics links ────────────────────────────────────────────── */}
            <AnalyticsLinks />

            {/* ── CRM Pipeline + General Info ───────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2">
                    <CRMPipeline data={crmData} loading={crmLoading} refetch={refetch} />
                </div>
                <div>
                    <GeneralInfo />
                </div>
            </div>

        </div>
    );
}
