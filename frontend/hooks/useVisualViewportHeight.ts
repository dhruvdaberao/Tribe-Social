import { useEffect } from 'react';

export const useVisualViewportHeight = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setViewportHeight = () => {
      // Use visualViewport height if available, falling back to innerHeight
      // visualViewport.height handles the on-screen keyboard correctly
      const height = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty('--vvh', `${height}px`);
    };

    setViewportHeight();

    // Listen to both window resize and visualViewport resize
    window.addEventListener('resize', setViewportHeight);
    window.visualViewport?.addEventListener('resize', setViewportHeight);
    window.visualViewport?.addEventListener('scroll', setViewportHeight);

    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.visualViewport?.removeEventListener('resize', setViewportHeight);
      window.visualViewport?.removeEventListener('scroll', setViewportHeight);
    };
  }, []);
};
