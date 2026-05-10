import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls to top on every route change.
 * Uses 'instant' scroll so position resets immediately before the page transition
 * animates in — prevents the "scroll flash" where you briefly see the bottom of
 * the previous page before jumping to top.
 */
const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
};

export default ScrollToTop;
