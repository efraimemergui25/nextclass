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
