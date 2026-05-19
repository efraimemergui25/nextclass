import { useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import PageTransition from '../components/PageTransition';

import HeroSection from '../components/HeroSection';
import SocialProofStrip from '../components/SocialProofStrip';
import HomeProductsSection from '../components/HomeProductsSection';
import ShoppableImage from '../components/ShoppableImage';
import EcosystemVisualizer from '../components/EcosystemVisualizer';
import ValueProps from '../components/ValueProps';
import QuoteWizard from '../components/QuoteWizard';

import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

function PersonalizedHeroBanner() {
    const { user, personalGreeting, tierLabel, tierColor, firstName, institution } = useAuth();
    if (!user || !firstName) return null;
    return (
        <AnimatePresence>
            <motion.div
                key="personal-hero-banner"
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                className="relative z-10 px-6 max-w-7xl mx-auto w-full pt-5 pb-1"
            >
                <div
                    style={{
                        background: `linear-gradient(135deg, ${tierColor}10, rgba(255,255,255,0.75))`,
                        border: `1px solid ${tierColor}22`,
                        backdropFilter: 'blur(24px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                        boxShadow: `0 4px 24px rgba(0,0,0,0.06), 0 0 0 0.5px ${tierColor}15`,
                    }}
                    className="rounded-2xl px-5 py-3.5 flex items-center gap-4"
                >
                    <div
                        style={{ background: `linear-gradient(135deg, ${tierColor}28, ${tierColor}48)`, color: tierColor }}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-[15px] font-black shrink-0 select-none"
                    >
                        {firstName[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                        <p className="text-[15px] font-black text-[#1D1D1F] tracking-tight leading-snug">
                            {personalGreeting}
                        </p>
                        {institution && (
                            <p className="text-[12px] text-[#86868B] font-medium mt-0.5">
                                {institution} · <span style={{ color: tierColor }} className="font-bold">{tierLabel}</span>
                            </p>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

const SECTION_DEFS = [
 { key: 'vis_hero', Component: HeroSection, delay: 0 },
 { key: 'vis_social_proof', Component: SocialProofStrip, delay: 0.04 },
 { key: 'vis_catalog', Component: HomeProductsSection, delay: 0.06 },
 { key: 'vis_value_props', Component: ValueProps, delay: 0.04 },
 { key: 'vis_ecosystem', Component: EcosystemVisualizer, delay: 0.05 },
 { key: 'vis_shoppable', Component: ShoppableImage, delay: 0.04 },
 { key: 'vis_quote_wizard', Component: QuoteWizard, delay: 0.04 },
];

// ── Scroll-triggered reveal with precise IntersectionObserver timing ──────────
function ScrollReveal({ children, delay = 0, distance = 28 }) {
 const ref = useRef(null);
 const inView = useInView(ref, { once: true, margin: '-12% 0px' });
 return (
  <motion.div
   ref={ref}
   initial={{ opacity: 0, y: distance, filter: 'blur(8px)' }}
   animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
   transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1], delay }}
  >
   {children}
  </motion.div>
 );
}


const LandingPage = () => {
 const { isVisible } = useSettings();
 const visibleSections = SECTION_DEFS.filter(s => isVisible(s.key, true));

 return (
 <PageTransition>
  <PersonalizedHeroBanner />
  <div className="flex flex-col bg-white -mt-[56px] md:-mt-[68px] w-full overflow-x-hidden">
   {visibleSections.map(({ key, Component, delay }, idx) => (
    <ScrollReveal key={key} delay={delay} distance={idx === 0 ? 0 : 28}>
     <Component />
    </ScrollReveal>
   ))}
  </div>
 </PageTransition>
 );
};

export default LandingPage;
