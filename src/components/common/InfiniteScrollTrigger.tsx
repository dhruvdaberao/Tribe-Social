import React, { useRef, useEffect } from 'react';

interface InfiniteScrollTriggerProps {
  onVisible: () => void;
  isLoading: boolean;
  hasMore?: boolean;
}

const InfiniteScrollTrigger: React.FC<InfiniteScrollTriggerProps> = ({ onVisible, isLoading, hasMore = true }) => {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          onVisible();
        }
      },
      { threshold: 1.0 }
    );

    const currentTrigger = triggerRef.current;
    if (currentTrigger) {
      observer.observe(currentTrigger);
    }

    return () => {
      if (currentTrigger) {
        observer.unobserve(currentTrigger);
      }
    };
  }, [onVisible, isLoading, hasMore]);

  return (
    <div ref={triggerRef} className="h-20 flex justify-center items-center">
      {isLoading && <img src="/duckload.gif" alt="Loading more..." className="w-12 h-12" />}
      {!isLoading && !hasMore && <p className="text-secondary text-sm">You've reached the end!</p>}
    </div>
  );
};

export default InfiniteScrollTrigger;