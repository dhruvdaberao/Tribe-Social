import { useEffect } from 'react';

const setViewportCssVars = () => {
  if (typeof window === 'undefined') return;
  const vv = window.visualViewport;
  const height = vv?.height ?? window.innerHeight;
  const offsetTop = vv?.offsetTop ?? 0;
  const keyboardInset = Math.max(0, window.innerHeight - height - offsetTop);
  document.documentElement.style.setProperty('--vvh', `${height}px`);
  document.documentElement.style.setProperty('--keyboard-inset', `${keyboardInset}px`);
};

export const useVisualViewportHeight = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setViewportCssVars();
    window.addEventListener('resize', setViewportCssVars);
    window.visualViewport?.addEventListener('resize', setViewportCssVars);
    window.visualViewport?.addEventListener('scroll', setViewportCssVars);

    const timers = [50, 150, 300, 600].map(delay => window.setTimeout(setViewportCssVars, delay));

    return () => {
      window.removeEventListener('resize', setViewportCssVars);
      window.visualViewport?.removeEventListener('resize', setViewportCssVars);
      window.visualViewport?.removeEventListener('scroll', setViewportCssVars);
      timers.forEach(window.clearTimeout);
    };
  }, []);
};
