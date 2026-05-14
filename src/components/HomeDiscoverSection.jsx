import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronLeft, ArrowLeft } from 'lucide-react';
import { useProducts } from '../context/ProductsContext';
import { useSettings } from '../context/SettingsContext';

// ── Premium dark card themes — each category gets its own color identity ──────
const CARD_THEMES = [
    { bg: 'linear-gradient(145deg, #0D1425 0%, #0F2040 100%)', glow: 'rgba(0,122,255,0.30)',    accent: '#007AFF'  },
    { bg: 'linear-gradient(145deg, #140E1F 0%, #221540 100%)', glow: 'rgba(191,90,242,0.28)',   accent: '#BF5AF2'  },
    { bg: 'linear-gradient(145deg, #0B1E16 0%, #103024 100%)', glow: 'rgba(48,209,88,0.26)',    accent: '#30D158'  },
    { bg: 'linear-gradient(145deg, #1D1408 0%, #332410 100%)', glow: 'rgba(255,159,10,0.26)',   accent: '#FF9F0A'  },
    { bg: 'linear-gradient(145deg, #190E1A 0%, #2D1630 100%)', glow: 'rgba(255,55,95,0.25)',  accent: '#FF375F'  },
    { bg: 'linear-gradient(145deg, #0C1C22 0%, #0F2E3A 100%)', glow: 'rgba(100,210,255,0.24)', accent: '#64D2FF'  },
];

// Single category card
const CategoryCard = ({ cat, products, theme, index, isWide }) => {
    const [hovered, setHovered] = useState(false);
    const previews = products.filter(p => p.image).slice(0, isWide ? 3 : 2);

    return (
        <motion.div
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: index * 0.07, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="h-full"
        >
            <Link
                to={`/catalog?category=${encodeURIComponent(cat)}`}
                className="group relative block rounded-[2.5rem] overflow-hidden cursor-pointer h-[340px]"
                style={{ background: theme.bg }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                dir="rtl"
            >
                {/* Ambient glow — intensifies on hover */}
                <motion.div
                    className="absolute bottom-0 left-0 w-72 h-72 rounded-full blur-[90px] pointer-events-none"
                    style={{ background: theme.glow }}
                    animate={{ scale: hovered ? 1.4 : 1, opacity: hovered ? 1 : 0.7 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                />

                {/* Grain texture overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'repeat',
                    }}
                />

                {/* Hover shine sweep */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 55%)' }} />

                {/* Product preview images — floating, tilted */}
                {previews.length > 0 && (
                    <div className="absolute left-6 top-0 bottom-0 flex items-center gap-3 pointer-events-none">
                        {previews.map((p, i) => (
                            <motion.div
                                key={p.id}
                                className="relative bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/12 shadow-2xl"
                                style={{
                                    width: isWide ? 100 : 88,
                                    height: isWide ? 100 : 88,
                                    transform: `rotate(${i === 0 ? '-6deg' : i === 1 ? '4deg' : '-2deg'}) translateY(${i * 10}px)`,
                                }}
                                animate={{ scale: hovered ? 1.06 : 1 }}
                                transition={{ delay: i * 0.06, duration: 0.5 }}
                            >
                                <img
                                    src={p.image}
                                    alt={p.title}
                                    className="w-full h-full object-contain p-3 opacity-85"
                                />
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Card content — stacked vertically, right-aligned */}
                <div className="absolute inset-0 flex flex-col justify-between p-8 md:p-10">
                    {/* Top: product count badge */}
                    <div className="flex justify-end">
                        <span
                            className="text-[9px] font-black tracking-[0.3em] px-3 py-1.5 rounded-full"
                            style={{
                                background: `${theme.accent}22`,
                                color: theme.accent,
                                border: `1px solid ${theme.accent}38`,
                            }}
                        >
                            {products.length} פתרונות
                        </span>
                    </div>

                    {/* Bottom: category name + CTA */}
                    <div className="text-right">
                        <h3 className="text-[22px] md:text-[26px] font-black text-white leading-snug tracking-tight mb-4 max-w-[200px] ml-auto">
                            {cat}
                        </h3>
                        <motion.div
                            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full font-bold text-[13px] text-white"
                            style={{ background: theme.accent }}
                            animate={{ gap: hovered ? '14px' : '10px' }}
                            transition={{ duration: 0.3 }}
                        >
                            גלה עכשיו
                            <ChevronLeft size={14} />
                        </motion.div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

// ── Main section ───────────────────────────────────────────────────────────────
const HomeDiscoverSection = () => {
    const { getSetting } = useSettings();
    const { activeProducts } = useProducts();

    const rawCats = getSetting(
        'catalog_categories',
        'מסכים אינטראקטיביים והקרנה, מחשוב לצוות ותלמידים, מעבדות STEM ומרחבי חדשנות, אודיו ווידאו למרחבי למידה, תשתיות ועגלות טעינה'
    );
    const categories = useMemo(
        () => rawCats.split(',').map(c => c.trim()).filter(Boolean),
        [rawCats]
    );

    const productsByCategory = useMemo(() => {
        const map = {};
        categories.forEach(cat => {
            map[cat] = activeProducts.filter(p => p.category === cat).slice(0, 3);
        });
        return map;
    }, [categories, activeProducts]);

    const eyebrow = getSetting('home_discover_eyebrow', 'מגוון פתרונות');
    const title   = getSetting('home_discover_title',   'גלו את הפתרונות שלנו.');
    const sub     = getSetting('home_discover_sub',     'מסכים אינטראקטיביים, מחשוב לחינוך, מעבדות STEM ועוד — הכל במקום אחד.');
    const cta1    = getSetting('home_discover_cta1',    'גלה את כל הפתרונות');
    const cta2    = getSetting('home_discover_cta2',    'לקטלוג המלא');

    const isOdd = categories.length % 2 !== 0;

    return (
        <section className="w-full py-32 bg-[#F5F5F7] relative overflow-hidden">

            {/* Very subtle ambient light blobs */}
            <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-[#007AFF]/4 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-[500px] h-[350px] bg-[#BF5AF2]/4 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-[1400px] mx-auto px-6 md:px-16">

                {/* ── Section header ─────────────────────────────────────── */}
                <div className="text-center mb-16" dir="rtl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.88 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-[#007AFF] font-bold text-[10px] tracking-[0.25em] mb-7 shadow-sm border border-white/60"
                    >
                        <Sparkles size={11} strokeWidth={2.5} />
                        <span>{eyebrow}</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                        className="text-4xl sm:text-5xl md:text-[64px] font-black tracking-tight leading-[1.04] text-[#1D1D1F] mb-6"
                    >
                        {title}
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="text-lg md:text-xl text-[#86868B] font-medium max-w-2xl mx-auto leading-relaxed"
                    >
                        {sub}
                    </motion.p>
                </div>

                {/* ── Category cards grid ────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                    {categories.map((cat, i) => {
                        const isLastOdd = isOdd && i === categories.length - 1;
                        return (
                            <div key={cat} className={isLastOdd ? 'md:col-span-2' : ''}>
                                <CategoryCard
                                    cat={cat}
                                    products={productsByCategory[cat] || []}
                                    theme={CARD_THEMES[i % CARD_THEMES.length]}
                                    index={i}
                                    isWide={isLastOdd}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* ── Bottom CTAs ────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.7 }}
                    className="mt-16 flex flex-wrap items-center justify-center gap-4"
                    dir="rtl"
                >
                    <Link
                        to="/discover"
                        className="group flex items-center gap-2.5 px-10 py-4 rounded-full bg-[#1D1D1F] text-white font-black text-[15px] hover:bg-[#007AFF] transition-all duration-300 shadow-xl hover:shadow-[0_12px_30px_rgba(0,122,255,0.35)] hover:scale-[1.02]"
                    >
                        {cta1}
                        <ArrowLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1" />
                    </Link>
                    <Link
                        to="/catalog"
                        className="px-10 py-4 rounded-full border border-[#D2D2D7] bg-white text-[#1D1D1F] font-bold text-[15px] hover:border-[#1D1D1F] hover:shadow-md transition-all duration-300"
                    >
                        {cta2}
                    </Link>
                </motion.div>
            </div>
        </section>
    );
};

export default HomeDiscoverSection;
