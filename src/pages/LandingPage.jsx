import React from 'react';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';

import HeroSection from '../components/HeroSection';
import SocialProofStrip from '../components/SocialProofStrip';
import CatalogGrid from '../components/CatalogGrid';
import ValueProps from '../components/ValueProps';

const LandingPage = () => {
    return (
        <PageTransition>
            {/* Prevent horizontal scroll overflow locally */}
            <div className="flex flex-col bg-white -mt-[60px] md:-mt-[73px] w-full overflow-x-hidden">

                <HeroSection />
                <SocialProofStrip />
                <CatalogGrid />

                <ValueProps />

            </div>
        </PageTransition>
    );
};

export default LandingPage;
