import { motion, AnimatePresence } from 'framer-motion';
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

const SECTION_DEFS = [
 { key: 'vis_hero', Component: HeroSection },
 { key: 'vis_social_proof', Component: SocialProofStrip },
 { key: 'vis_catalog', Component: HomeProductsSection },
 { key: 'vis_value_props', Component: ValueProps },
 { key: 'vis_ecosystem', Component: EcosystemVisualizer },
 { key: 'vis_shoppable', Component: ShoppableImage },
 { key: 'vis_quote_wizard', Component: QuoteWizard },
];

function PersonalizedHeroBanner() {
 const { user, personalGreeting, shortGreeting, tierLabel, tierColor, firstName, institution } = useAuth();
 if (!user || !firstName) return null;
 return (
  <AnimatePresence>
   <motion.div
    key="personal-hero-banner"
    initial={{ opacity: 0, y: -16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
    className="relative z-10 px-6 pt-6 pb-0 max-w-7xl mx-auto w-full"
   >
    <div
     style={{ background: `linear-gradient(135deg, ${tierColor}14, ${tierColor}06)`, border: `1px solid ${tierColor}28` }}
     className="rounded-2xl px-6 py-4 flex items-center gap-4 shadow-sm"
    >
     {/* Avatar */}
     <div
      style={{ background: `linear-gradient(135deg, ${tierColor}30, ${tierColor}55)`, border: `2px solid ${tierColor}50`, color: tierColor }}
      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black shrink-0"
     >
      {firstName[0].toUpperCase()}
     </div>
     <div className="flex-1 min-w-0">
      <p className="text-[17px] font-black text-[#1D1D1F] tracking-tight leading-snug">
       {personalGreeting}
      </p>
      <p className="text-[13px] text-[#86868B] font-medium mt-0.5">
       {institution ? `${institution} · ` : ''}<span style={{ color: tierColor }} className="font-bold">{tierLabel}</span>
      </p>
     </div>
    </div>
   </motion.div>
  </AnimatePresence>
 );
}

const LandingPage = () => {
 const { isVisible } = useSettings();
 const visibleSections = SECTION_DEFS.filter(s => isVisible(s.key, true));

 return (
 <PageTransition>
  <PersonalizedHeroBanner />
 <motion.div
 initial="hidden"
 whileInView="visible"
 viewport={{ once: true, margin: '-100px' }}
 variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
 className="flex flex-col bg-white -mt-[56px] md:-mt-[68px] w-full overflow-x-hidden"
 >
 {visibleSections.map(({ key, Component }) => (
 <motion.div
 key={key}
 variants={{
 hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
 visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
 }}
 transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
 >
 <Component />
 </motion.div>
 ))}
 </motion.div>
 </PageTransition>
 );
};

export default LandingPage;
