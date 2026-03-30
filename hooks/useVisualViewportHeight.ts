import { useEffect } from 'react';

export const useVisualViewportHeight = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setViewportHeight = () => {
      const viewport = window.visualViewport;
      const height = viewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty('--vvh', `${height}px`);
      document.documentElement.style.setProperty('--app-height', `${height}px`);

      const keyboardInset = viewport
        ? Math.max(0, window.innerHeight - (viewport.height + viewport.offsetTop))
        : 0;
      document.documentElement.style.setProperty('--keyboard-inset-height', `${keyboardInset}px`);
    };

    setViewportHeight();
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
