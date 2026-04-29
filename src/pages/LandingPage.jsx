import React from 'react';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';

import HeroSection from '../components/HeroSection';
import SocialProofStrip from '../components/SocialProofStrip';
import CatalogGrid from '../components/CatalogGrid';
import ShoppableImage from '../components/ShoppableImage';
import EcosystemVisualizer from '../components/EcosystemVisualizer';
import ValueProps from '../components/ValueProps';
import QuoteWizard from '../components/QuoteWizard';

const LandingPage = () => {
    return (
        <PageTransition>
            <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={{
                    visible: { transition: { staggerChildren: 0.1 } }
                }}
                className="flex flex-col bg-white -mt-[56px] md:-mt-[68px] w-full overflow-x-hidden"
            >
                {[
                    <HeroSection />,
                    <SocialProofStrip />,
                    <CatalogGrid />,
                    <EcosystemVisualizer />,
                    <ShoppableImage />,
                    <QuoteWizard />,
                    <ValueProps />
                ].map((component, idx) => (
                    <motion.div
                        key={idx}
                        variants={{
                            hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
                            visible: { opacity: 1, y: 0, filter: 'blur(0px)' }
                        }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {component}
                    </motion.div>
                ))}
            </motion.div>
        </PageTransition>
    );
};

export default LandingPage;
