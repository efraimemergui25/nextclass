import { useRef, useMemo } from 'react';
import { motion, useInView } from 'framer-motion';
import PageTransition from '../components/PageTransition';

import HeroSection from '../components/HeroSection';
import SocialProofStrip from '../components/SocialProofStrip';
import HomeProductsSection from '../components/HomeProductsSection';
import ShoppableImage from '../components/ShoppableImage';
import EcosystemVisualizer from '../components/EcosystemVisualizer';
import ValueProps from '../components/ValueProps';
import QuoteWizard from '../components/QuoteWizard';
import TestimonialsSection from '../components/TestimonialsSection';

import { useSettings } from '../context/SettingsContext';


const SECTION_DEFS = [
 { key: 'vis_hero', Component: HeroSection, delay: 0 },
 { key: 'vis_social_proof', Component: SocialProofStrip, delay: 0.04 },
 { key: 'vis_catalog', Component: HomeProductsSection, delay: 0.06 },
 { key: 'vis_value_props', Component: ValueProps, delay: 0.04 },
 { key: 'vis_ecosystem', Component: EcosystemVisualizer, delay: 0.05 },
 { key: 'vis_shoppable', Component: ShoppableImage, delay: 0.04 },
 { key: 'vis_testimonials', Component: TestimonialsSection, delay: 0.04 },
 { key: 'vis_quote_wizard', Component: QuoteWizard, delay: 0.04 },
];

const REVEAL_TRANSITION = { duration: 0.6, ease: [0.22, 1, 0.36, 1] };
const REVEAL_HIDDEN     = { opacity: 0, y: 24 };
const REVEAL_VISIBLE    = { opacity: 1, y: 0 };

function ScrollReveal({ children, delay = 0, distance = 24 }) {
 const ref = useRef(null);
 const inView = useInView(ref, { once: true, margin: '-10% 0px' });
 return (
  <motion.div
   ref={ref}
   initial={REVEAL_HIDDEN}
   animate={inView ? REVEAL_VISIBLE : REVEAL_HIDDEN}
   transition={{ ...REVEAL_TRANSITION, delay }}
  >
   {children}
  </motion.div>
 );
}

const LandingPage = () => {
 const { isVisible } = useSettings();
 const visibleSections = useMemo(
   () => SECTION_DEFS.filter(s => isVisible(s.key, true)),
   [isVisible]
 );

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
