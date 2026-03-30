import { useEffect } from 'react';

export const useVisualViewportHeight = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setViewportHeight = () => {
      const viewport = window.visualViewport;
      const height = viewport?.height ?? window.innerHeight;
      const offsetTop = viewport?.offsetTop ?? 0;
      const keyboardInset = Math.max(0, window.innerHeight - height - offsetTop);

      document.documentElement.style.setProperty('--app-height', `${height}px`);
      document.documentElement.style.setProperty('--vvh', `${height}px`);
      document.documentElement.style.setProperty('--keyboard-inset-height', `${keyboardInset}px`);
    };

    setViewportHeight();

    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);
    window.visualViewport?.addEventListener('resize', setViewportHeight);
    window.visualViewport?.addEventListener('scroll', setViewportHeight);

    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', setViewportHeight);
      window.visualViewport?.removeEventListener('resize', setViewportHeight);
      window.visualViewport?.removeEventListener('scroll', setViewportHeight);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateHeight = () => {
      const viewport = window.visualViewport;
      const height = viewport?.height ?? window.innerHeight;
      const offsetTop = viewport?.offsetTop ?? 0;
      const keyboardInset = Math.max(0, window.innerHeight - height - offsetTop);

      document.documentElement.style.setProperty('--app-height', `${height}px`);
      document.documentElement.style.setProperty('--vvh', `${height}px`);
      document.documentElement.style.setProperty('--keyboard-inset-height', `${keyboardInset}px`);
    };

    updateHeight();

    const intervals = [100, 300, 500, 1000];
    const timers = intervals.map(t => setTimeout(updateHeight, t));

    return () => timers.forEach(clearTimeout);
  }, []);
};
