/* eslint-disable */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminSectionHeader, AdminButton, AdminInput } from '../components/AdminComponents';
import { useToast } from '../context/AdminToastContext';

const LS_KEY = 'nextclass_content';
const LS_VOD = 'nextclass_vod';
const card = { border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' };

// ── Default video library ─────────────────────────────────────────────────────
const DEFAULT_VIDEOS = [
    { id: 1, title: 'איך להשתמש בלוח הלבן האינטראקטיבי', duration: '03:45', thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600', videoUrl: '', visible: true, category: 'מסכים' },
    { id: 2, title: 'חיבור מסך מגע לרשת בית ספרית', duration: '05:12', thumbnail: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=600', videoUrl: '', visible: true, category: 'רשת' },
    { id: 3, title: 'הגדרת EduEdit Studio בפעם הראשונה', duration: '07:30', thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600', videoUrl: '', visible: true, category: 'תוכנה' },
    { id: 4, title: 'ניהול כיתה דיגיטלית עם Google Classroom', duration: '04:18', thumbnail: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&q=80&w=600', videoUrl: '', visible: true, category: 'תוכנה' },
    { id: 5, title: 'שימוש ב-20 נקודות מגע בו-זמנית', duration: '02:55', thumbnail: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&q=80&w=600', videoUrl: '', visible: true, category: 'מסכים' },
    { id: 6, title: 'התקנת מעמד חשמלי מתכוונן', duration: '06:10', thumbnail: 'https://images.unsplash.com/photo-1555529902-5261145633bf?auto=format&fit=crop&q=80&w=600', videoUrl: '', visible: true, category: 'ריהוט' },
];

// ── Site visibility toggles ───────────────────────────────────────────────────
const VISIBILITY_ITEMS = [
    { key: 'vis_hero',        label: 'סקציית Hero',           desc: 'הכותרת הראשית עם האנימציה והCTA', icon: '🏠' },
    { key: 'vis_social_proof',label: 'רצועת מוסדות',          desc: 'סרגל לוגואים של מוסדות שותפים', icon: '🏫' },
    { key: 'vis_catalog',     label: 'גריד מוצרים',           desc: 'רשת המוצרים בדף הבית', icon: '🛍️' },
    { key: 'vis_ecosystem',   label: 'ויז׳ואל אקוסיסטם',      desc: 'תרשים המערכת האינטראקטיבי', icon: '🌐' },
    { key: 'vis_shoppable',   label: 'תמונה אינטראקטיבית',    desc: 'תמונה קניה עם נקודות מוצר', icon: '🖼️' },
    { key: 'vis_quote_wizard',label: 'אשף הצעת מחיר',         desc: 'כלי בניית הצעת המחיר המובנה', icon: '📋' },
    { key: 'vis_value_props', label: 'יתרונות הפלטפורמה',     desc: 'קטע ה-Value Props והנתונים', icon: '⭐' },
];

// ── Text-field sections (shared editor UI) ───────────────────────────────────
const FIELD_SECTIONS = [
    {
        id: 'hero',
        label: 'דף בית — Hero',
        icon: '🏠',
        accent: '#007AFF',
        fields: [
            { key: 'hero_headline', label: 'כותרת ראשית', type: 'text', default: 'חדשנות חסרת פשרות.' },
            { key: 'hero_subline',  label: 'תת כותרת',    type: 'text', default: 'מקצוענות בכל מרחב למידה.' },
            { key: 'hero_cta',      label: 'טקסט כפתור',  type: 'text', default: 'גלו את הפתרונות שלנו' },
        ],
    },
    {
        id: 'contact_full',
        label: 'עמוד צור קשר',
        icon: '📞',
        accent: '#34C759',
        fields: [
            { key: 'contact_page_title',    label: 'כותרת הדף',        type: 'text',     default: 'דברו איתנו' },
            { key: 'contact_page_subtitle', label: 'תת כותרת',         type: 'textarea', default: 'אנחנו כאן בשבילכם — מהייעוץ הראשון ועד אחרי ההתקנה.' },
            { key: 'contact_phone',         label: 'טלפון',             type: 'text',     default: '03-9999999' },
            { key: 'contact_email',         label: 'מייל',              type: 'text',     default: 'info@nextclass.co.il' },
            { key: 'contact_address',       label: 'כתובת',             type: 'text',     default: 'תל אביב, ישראל' },
            { key: 'contact_hours',         label: 'שעות פעילות',       type: 'text',     default: 'ראשון–חמישי 08:00–18:00' },
            { key: 'contact_whatsapp',      label: 'מספר WhatsApp',     type: 'text',     default: '' },
            { key: 'contact_form_note',     label: 'הערה מתחת לטופס',   type: 'textarea', default: 'נחזור אליכם תוך יום עסקים.' },
        ],
    },
    {
        id: 'about_full',
        label: 'עמוד אודות',
        icon: '📖',
        accent: '#FF9500',
        fields: [
            { key: 'about_hero_title',   label: 'כותרת Hero',           type: 'text',     default: 'הסיפור שלנו' },
            { key: 'about_hero_sub',     label: 'תת כותרת Hero',        type: 'textarea', default: 'NextClass מתמחה בפתרונות טכנולוגיים מובילים למוסדות חינוך.' },
            { key: 'about_stat1_val',    label: 'נתון 1 — מספר',        type: 'text',     default: '1200' },
            { key: 'about_stat1_label',  label: 'נתון 1 — תווית',       type: 'text',     default: 'מוסדות חינוך' },
            { key: 'about_stat2_val',    label: 'נתון 2 — מספר',        type: 'text',     default: '14' },
            { key: 'about_stat2_label',  label: 'נתון 2 — תווית',       type: 'text',     default: 'שנות ניסיון' },
            { key: 'about_stat3_val',    label: 'נתון 3 — מספר',        type: 'text',     default: '98' },
            { key: 'about_stat3_label',  label: 'נתון 3 — תווית',       type: 'text',     default: '% שביעות רצון' },
            { key: 'about_story_body',   label: 'סיפור החברה (פסקה)',    type: 'textarea', default: 'NextClass מתמחה בפתרונות טכנולוגיים מובילים למוסדות חינוך ברחבי ישראל. אנחנו מאמינים שטכנולוגיה נכונה מעצימה מורים ומסייעת לכל תלמיד להגיע לפוטנציאל המלא שלו.' },
        ],
    },
    {
        id: 'footer',
        label: 'תחתית האתר',
        icon: '📄',
        accent: '#5856D6',
        fields: [
            { key: 'footer_tagline',   label: 'טקסט תיאור', type: 'textarea', default: 'אנחנו מעצבים את הכלים שמעצימים את דור המחר. חדשנות, איכות וחזון בכל כיתה.' },
            { key: 'footer_copyright', label: 'שורת קרדיט', type: 'text',     default: '© 2026 NextClass. כל הזכויות שמורות.' },
        ],
    },
    {
        id: 'seo',
        label: 'SEO ומטא',
        icon: '🔍',
        accent: '#FF3B30',
        fields: [
            { key: 'seo_title',       label: 'כותרת SEO',    type: 'text',     default: 'NextClass — טכנולוגיה חינוכית מתקדמת' },
            { key: 'seo_description', label: 'תיאור מטא',    type: 'textarea', default: 'NextClass מספקת פתרונות טכנולוגיים חינוכיים מתקדמים לבתי ספר ומוסדות חינוך בישראל.' },
            { key: 'seo_keywords',    label: 'מילות מפתח',   type: 'text',     default: 'טכנולוגיה חינוכית, מסכים אינטראקטיביים, כיתה חכמה' },
        ],
    },
];

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ on, onChange }) {
    return (
        <motion.button
            type="button"
            onClick={() => onChange(!on)}
            animate={{ backgroundColor: on ? '#34C759' : '#E5E5EA' }}
            transition={{ duration: 0.2 }}
            className="relative w-12 h-7 rounded-full shrink-0 focus:outline-none"
        >
            <motion.div
                animate={{ x: on ? 22 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
            />
        </motion.button>
    );
}

// ── Visibility section ────────────────────────────────────────────────────────
function VisibilitySection({ content, onChange }) {
    return (
        <div className="p-6 space-y-3">
            <p className="text-[#6E6E73] text-xs mb-5 text-right leading-relaxed">
                כבה חלקים מהאתר ללא מחיקה — המבקרים לא יראו אותם, אך כל התוכן נשמר ומוכן לחזרה.
            </p>
            {VISIBILITY_ITEMS.map(item => {
                const isOn = content[item.key] !== false;
                return (
                    <motion.div key={item.key}
                        whileHover={{ scale: 1.005 }}
                        className="flex items-center justify-between p-4 rounded-2xl transition-colors"
                        style={{ background: isOn ? 'rgba(52,199,89,0.06)' : 'rgba(174,174,178,0.10)', border: `1px solid ${isOn ? 'rgba(52,199,89,0.18)' : 'rgba(0,0,0,0.06)'}` }}
                    >
                        <Toggle on={isOn} onChange={v => onChange(item.key, v)} />
                        <div className="flex-1 text-right mx-4">
                            <div className="flex items-center justify-end gap-2">
                                <p className="text-[#1D1D1F] font-bold text-sm">{item.label}</p>
                                <span className="text-base">{item.icon}</span>
                            </div>
                            <p className="text-[#AEAEB2] text-xs mt-0.5">{item.desc}</p>
                        </div>
                        <span className="text-[10px] font-black shrink-0 w-10 text-right" style={{ color: isOn ? '#34C759' : '#AEAEB2' }}>
                            {isOn ? 'פעיל' : 'כבוי'}
                        </span>
                    </motion.div>
                );
            })}
        </div>
    );
}

// ── Video row editor ──────────────────────────────────────────────────────────
function VideoRow({ video, onUpdate, onRemove }) {
    const [expanded, setExpanded] = useState(false);
    return (
        <motion.div layout className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
            {/* Header row */}
            <div className="flex items-center gap-3 px-4 py-3">
                <Toggle on={video.visible !== false} onChange={v => onUpdate(video.id, { visible: v })} />
                <div className="w-16 h-10 rounded-xl overflow-hidden bg-[#F5F5F7] shrink-0">
                    {video.thumbnail
                        ? <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-lg opacity-30">🎬</div>}
                </div>
                <div className="flex-1 min-w-0 text-right">
                    <p className="text-[#1D1D1F] font-bold text-sm line-clamp-1">{video.title || 'ללא כותרת'}</p>
                    <p className="text-[#AEAEB2] text-xs">{video.duration || '--:--'} · {video.category || 'כללי'}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <button type="button" onClick={() => setExpanded(e => !e)}
                        className="text-[#007AFF] text-xs font-bold hover:underline">
                        {expanded ? 'סגור' : 'עריכה'}
                    </button>
                    <button type="button" onClick={() => onRemove(video.id)}
                        className="text-[#FF3B30] text-xs font-bold hover:underline">מחק</button>
                </div>
            </div>

            {/* Expanded editor */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden border-t border-black/06"
                    >
                        <div className="p-4 space-y-3" dir="rtl">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[#6E6E73] text-[10px] font-black uppercase tracking-widest mb-1">כותרת</label>
                                    <input value={video.title} onChange={e => onUpdate(video.id, { title: e.target.value })} dir="rtl"
                                        className="w-full border border-black/10 rounded-xl px-3 py-2 text-sm text-[#1D1D1F] outline-none focus:border-[#007AFF]/50 bg-[#F5F5F7]" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[#6E6E73] text-[10px] font-black uppercase tracking-widest mb-1">משך</label>
                                        <input value={video.duration} onChange={e => onUpdate(video.id, { duration: e.target.value })} dir="ltr"
                                            placeholder="00:00"
                                            className="w-full border border-black/10 rounded-xl px-3 py-2 text-sm text-[#1D1D1F] outline-none focus:border-[#007AFF]/50 bg-[#F5F5F7]" />
                                    </div>
                                    <div>
                                        <label className="block text-[#6E6E73] text-[10px] font-black uppercase tracking-widest mb-1">קטגוריה</label>
                                        <input value={video.category || ''} onChange={e => onUpdate(video.id, { category: e.target.value })} dir="rtl"
                                            className="w-full border border-black/10 rounded-xl px-3 py-2 text-sm text-[#1D1D1F] outline-none focus:border-[#007AFF]/50 bg-[#F5F5F7]" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[#6E6E73] text-[10px] font-black uppercase tracking-widest mb-1">URL תמונה ממוזערת</label>
                                <input value={video.thumbnail} onChange={e => onUpdate(video.id, { thumbnail: e.target.value })} dir="ltr"
                                    placeholder="https://..."
                                    className="w-full border border-black/10 rounded-xl px-3 py-2 text-sm text-[#1D1D1F] outline-none focus:border-[#007AFF]/50 bg-[#F5F5F7]" />
                            </div>
                            <div>
                                <label className="block text-[#6E6E73] text-[10px] font-black uppercase tracking-widest mb-1">URL סרטון (YouTube / Vimeo)</label>
                                <input value={video.videoUrl || ''} onChange={e => onUpdate(video.id, { videoUrl: e.target.value })} dir="ltr"
                                    placeholder="https://youtube.com/watch?v=..."
                                    className="w-full border border-black/10 rounded-xl px-3 py-2 text-sm text-[#1D1D1F] outline-none focus:border-[#007AFF]/50 bg-[#F5F5F7]" />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ── Videos manager section ────────────────────────────────────────────────────
function VideosSection({ showToast }) {
    const [videos, setVideos] = useState(() => {
        try {
            const v = localStorage.getItem(LS_VOD);
            return v ? JSON.parse(v) : DEFAULT_VIDEOS;
        } catch { return DEFAULT_VIDEOS; }
    });

    useEffect(() => {
        localStorage.setItem(LS_VOD, JSON.stringify(videos));
        window.dispatchEvent(new StorageEvent('storage', { key: LS_VOD, newValue: JSON.stringify(videos) }));
    }, [videos]);

    const addVideo = () => setVideos(prev => [...prev, {
        id: Date.now(), title: 'סרטון חדש', duration: '00:00',
        thumbnail: '', videoUrl: '', visible: true, category: 'כללי',
    }]);
    const removeVideo = (id) => { setVideos(prev => prev.filter(v => v.id !== id)); showToast('סרטון נמחק', 'info'); };
    const updateVideo = (id, updates) => setVideos(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));

    const visibleCount = videos.filter(v => v.visible !== false).length;

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
                <button type="button" onClick={addVideo}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white"
                    style={{ background: '#007AFF' }}>
                    + הוסף סרטון
                </button>
                <p className="text-[#AEAEB2] text-xs text-right">{visibleCount} מתוך {videos.length} מוצגים</p>
            </div>
            <AnimatePresence>
                {videos.map(video => (
                    <motion.div key={video.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <VideoRow video={video} onUpdate={updateVideo} onRemove={removeVideo} />
                    </motion.div>
                ))}
            </AnimatePresence>
            {videos.length === 0 && (
                <div className="py-12 text-center text-[#AEAEB2] text-sm">אין סרטונים — הוסף את הראשון</div>
            )}
        </div>
    );
}

// ── Field input ───────────────────────────────────────────────────────────────
function FieldInput({ field, value, onChange }) {
    return (
        <AdminInput
            label={field.label}
            value={value}
            onChange={onChange}
            type={field.type === 'textarea' ? undefined : field.type}
            rows={field.type === 'textarea' ? 3 : undefined}
            placeholder={field.default}
        />
    );
}

// ── All nav items ─────────────────────────────────────────────────────────────
const ALL_SECTIONS = [
    { id: 'visibility', label: 'נראות סקציות', icon: '👁', accent: '#5856D6', type: 'visibility' },
    { id: 'videos',     label: 'סרטוני הדרכה', icon: '🎬', accent: '#FF3B30', type: 'videos' },
    ...FIELD_SECTIONS,
];

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminContent() {
    const { showToast } = useToast();
    const [activeSection, setActiveSection] = useState('visibility');
    const [content, setContent] = useState({});
    const [saved, setSaved] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(LS_KEY);
            if (stored) setContent(JSON.parse(stored));
        } catch {}
    }, []);

    const handleChange = (key, value) => {
        setContent(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
        setSaved(false);
    };

    const handleSave = () => {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(content));
            window.dispatchEvent(new StorageEvent('storage', { key: LS_KEY, newValue: JSON.stringify(content) }));
            setSaved(true);
            setHasChanges(false);
            showToast('התוכן נשמר בהצלחה', 'success');
            setTimeout(() => setSaved(false), 2000);
        } catch {}
    };

    const handleReset = (section) => {
        const updates = {};
        section.fields.forEach(f => { updates[f.key] = f.default; });
        setContent(prev => ({ ...prev, ...updates }));
        setHasChanges(true);
        setSaved(false);
    };

    const currentDef = ALL_SECTIONS.find(s => s.id === activeSection);

    return (
        <div dir="rtl" className="space-y-6">
            <AdminSectionHeader
                title="תוכן ונראות האתר"
                subtitle="שלוט בכל טקסט, חלק ותוכן — שינויים מיידיים ללא קוד"
                action={
                    <div className="flex items-center gap-3">
                        {hasChanges && (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="text-[#FF9500] text-xs font-bold">
                                יש שינויים שלא נשמרו
                            </motion.span>
                        )}
                        <AdminButton onClick={handleSave}>
                            {saved ? '✓ נשמר!' : 'שמור שינויים'}
                        </AdminButton>
                    </div>
                }
            />

            <div className="flex gap-6">
                {/* Sidebar nav */}
                <div className="w-52 shrink-0">
                    <div className="bg-white rounded-[20px] overflow-hidden" style={card}>
                        {ALL_SECTIONS.map(s => (
                            <button key={s.id} type="button" onClick={() => setActiveSection(s.id)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-right transition-all border-b border-black/04 last:border-0"
                                style={{
                                    background: activeSection === s.id ? `${s.accent}10` : 'transparent',
                                    borderRight: activeSection === s.id ? `3px solid ${s.accent}` : '3px solid transparent',
                                }}>
                                <span className="text-base">{s.icon}</span>
                                <span className="text-sm font-bold flex-1 text-right"
                                    style={{ color: activeSection === s.id ? s.accent : '#6E6E73' }}>
                                    {s.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content panel */}
                <div className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">
                        <motion.div key={activeSection}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.18 }}
                            className="bg-white rounded-[20px] overflow-hidden"
                            style={card}
                        >
                            {/* Panel header */}
                            <div className="h-0.5" style={{ background: currentDef?.accent }} />
                            <div className="px-6 py-4 border-b border-black/06 bg-[#FAFAFA] flex items-center justify-between">
                                {currentDef?.type === 'fields' || (!currentDef?.type) ? (
                                    <button type="button"
                                        onClick={() => { const s = FIELD_SECTIONS.find(f => f.id === activeSection); if (s) handleReset(s); }}
                                        className="text-[#AEAEB2] text-xs font-bold hover:text-[#FF3B30] transition-colors">
                                        איפוס לברירת מחדל
                                    </button>
                                ) : <div />}
                                <div className="text-right">
                                    <h2 className="text-[#1D1D1F] font-black text-base">{currentDef?.icon} {currentDef?.label}</h2>
                                </div>
                            </div>

                            {/* Panel body */}
                            {currentDef?.type === 'visibility' && (
                                <VisibilitySection content={content} onChange={handleChange} />
                            )}

                            {currentDef?.type === 'videos' && (
                                <VideosSection showToast={showToast} />
                            )}

                            {!currentDef?.type && currentDef && (
                                <div className="p-6 space-y-5">
                                    {currentDef.fields.map(field => (
                                        <div key={field.key}>
                                            <FieldInput
                                                field={field}
                                                value={content[field.key] !== undefined ? content[field.key] : field.default}
                                                onChange={v => handleChange(field.key, v)}
                                            />
                                        </div>
                                    ))}
                                    <div className="pt-2 border-t border-black/06 flex justify-start">
                                        <AdminButton onClick={handleSave}>
                                            {saved ? '✓ נשמר!' : 'שמור שינויים'}
                                        </AdminButton>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <div className="flex items-start gap-3 px-5 py-4 rounded-2xl"
                style={{ background: 'rgba(0,122,255,0.06)', border: '1px solid rgba(0,122,255,0.15)' }}>
                <span className="text-lg shrink-0">💡</span>
                <div className="text-right">
                    <p className="text-[#007AFF] text-sm font-black">שינויים מיידיים</p>
                    <p className="text-[#6E6E73] text-xs mt-0.5">
                        לאחר שמירה, השינויים מתעדכנים אוטומטית באתר — ניראות הסקציות פועלת מיד ללא שמירה.
                    </p>
                </div>
            </div>
        </div>
    );
}
