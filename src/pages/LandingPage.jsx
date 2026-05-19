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

function PersonalizedGreetingCard() {
    const { user, personalGreeting, tierLabel, tierColor, firstName, institution } = useAuth();
    if (!user || !firstName) return null;

    return (
        <AnimatePresence>
            <motion.div
                key="personal-greeting-card"
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                className="w-full px-4 md:px-8 py-6 max-w-7xl mx-auto"
            >
                <div
                    style={{
                        background: `linear-gradient(135deg, rgba(255,255,255,0.82) 0%, ${tierColor}09 60%, rgba(255,255,255,0.60) 100%)`,
                        border: `1px solid ${tierColor}28`,
                        backdropFilter: 'blur(32px) saturate(200%)',
                        WebkitBackdropFilter: 'blur(32px) saturate(200%)',
                        boxShadow: `0 8px 32px rgba(0,0,0,0.07), 0 1.5px 0 0 ${tierColor}18, inset 0 1px 0 rgba(255,255,255,0.9)`,
                    }}
                    className="rounded-3xl px-6 py-5 flex items-center gap-5 relative overflow-hidden"
                >
                    {/* Subtle glow orb */}
                    <div
                        style={{
                            background: `radial-gradient(circle, ${tierColor}22 0%, transparent 70%)`,
                            width: 160, height: 160,
                            position: 'absolute', left: -40, top: -40,
                            pointerEvents: 'none',
                        }}
                    />

                    {/* Avatar */}
                    <motion.div
                        initial={{ scale: 0.7, rotate: -8 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1], delay: 0.25 }}
                        style={{
                            background: `linear-gradient(140deg, ${tierColor}35, ${tierColor}60)`,
                            color: tierColor,
                            boxShadow: `0 4px 16px ${tierColor}30, inset 0 1px 0 rgba(255,255,255,0.4)`,
                        }}
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-[18px] font-black shrink-0 select-none relative z-10"
                    >
                        {firstName[0].toUpperCase()}
                    </motion.div>

                    {/* Text */}
                    <div className="flex-1 min-w-0 text-right relative z-10">
                        <motion.p
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="text-[16px] md:text-[17px] font-black text-[#1D1D1F] tracking-tight leading-snug"
                        >
                            {personalGreeting}
                        </motion.p>
                        {institution && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.4, delay: 0.42 }}
                                className="text-[12.5px] text-[#86868B] font-medium mt-1 flex items-center gap-1.5 justify-end"
                            >
                                <span>{institution}</span>
                                <span className="w-1 h-1 rounded-full bg-[#C7C7CC] inline-block" />
                                <span style={{ color: tierColor }} className="font-bold">{tierLabel}</span>
                            </motion.p>
                        )}
                    </div>

                    {/* Shine edge */}
                    <div
                        style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(120deg, rgba(255,255,255,0.18) 0%, transparent 50%)',
                            borderRadius: 'inherit',
                            pointerEvents: 'none',
                        }}
                    />
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
  <div className="flex flex-col bg-white -mt-[56px] md:-mt-[68px] w-full overflow-x-hidden">
   {visibleSections.map(({ key, Component, delay }, idx) => (
    <ScrollReveal key={key} delay={delay} distance={idx === 0 ? 0 : 28}>
     {key === 'vis_catalog' && <PersonalizedGreetingCard />}
     <Component />
    </ScrollReveal>
   ))}
  </div>
 </PageTransition>
 );
};

export default LandingPage;
