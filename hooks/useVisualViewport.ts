import { useState, useEffect } from 'react';

export const useVisualViewport = () => {
    const [viewportHeight, setViewportHeight] = useState<number>(() => {
        if (typeof window !== 'undefined' && window.visualViewport) {
            return window.visualViewport.height;
        }
        if (typeof window !== 'undefined') {
            return window.innerHeight;
        }
        return 0;
    });

    useEffect(() => {
        if (typeof window === 'undefined' || !window.visualViewport) return;

        const handleResize = () => {
            if (window.visualViewport) {
                setViewportHeight(window.visualViewport.height);
            }
        };

        window.visualViewport.addEventListener('resize', handleResize);
        window.visualViewport.addEventListener('scroll', handleResize); // sometimes scroll affects viewport on mobile

        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
                window.visualViewport.removeEventListener('scroll', handleResize);
            }
        };
    }, []);

    return viewportHeight;
};
