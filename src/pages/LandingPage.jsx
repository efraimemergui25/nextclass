import React from 'react';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';

import HeroSection from '../components/HeroSection';
import SocialProofStrip from '../components/SocialProofStrip';
import CatalogGrid from '../components/CatalogGrid';
import ShoppableImage from '../components/ShoppableImage';
import ValueProps from '../components/ValueProps';
import QuoteWizard from '../components/QuoteWizard';

const LandingPage = () => {
    return (
        <PageTransition>
            {/* Prevent horizontal scroll overflow locally */}
            <div className="flex flex-col bg-white -mt-[60px] md:-mt-[73px] w-full overflow-x-hidden">

                <HeroSection />
                <SocialProofStrip />
                <CatalogGrid />
                <ShoppableImage />
                <QuoteWizard />
                <ValueProps />

            </div>
        </PageTransition>
    );
};

export default LandingPage;
