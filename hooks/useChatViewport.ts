import { useEffect } from 'react';

const clamp = (value: number) => Math.max(0, value);

const getViewportValues = () => {
  if (typeof window === 'undefined') {
    return { viewportHeight: null as number | null, keyboardOffset: 0 };
  }

  const visualViewport = window.visualViewport;
  if (!visualViewport) {
    return {
      viewportHeight: window.innerHeight,
      keyboardOffset: 0,
    };
  }

  const viewportHeight = visualViewport.height;
  const keyboardOffset = clamp(
    window.innerHeight - visualViewport.height - visualViewport.offsetTop,
  );

  return { viewportHeight, keyboardOffset };
};

const applyViewportVariables = () => {
  if (typeof document === 'undefined') return;

  const { viewportHeight, keyboardOffset } = getViewportValues();

  if (viewportHeight) {
    document.documentElement.style.setProperty('--vvh', `${viewportHeight}px`);
  }

  document.documentElement.style.setProperty('--keyboardOffset', `${keyboardOffset}px`);
};

const useChatViewport = () => {
  useEffect(() => {
    applyViewportVariables();

    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener('resize', applyViewportVariables);
    visualViewport?.addEventListener('scroll', applyViewportVariables);
    window.addEventListener('resize', applyViewportVariables);

    return () => {
      visualViewport?.removeEventListener('resize', applyViewportVariables);
      visualViewport?.removeEventListener('scroll', applyViewportVariables);
      window.removeEventListener('resize', applyViewportVariables);
    };
  }, []);
};

export default useChatViewport;

