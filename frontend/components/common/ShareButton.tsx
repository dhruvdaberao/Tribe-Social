import React from 'react';
import { toast } from './Toast';

// Fix: Extended ShareButtonProps with standard button attributes to allow props like 'role'.
interface ShareButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shareData: ShareData;
  className?: string;
  children: React.ReactNode;
  onShare?: () => void;
}

const ShareButton: React.FC<ShareButtonProps> = ({ shareData, className, children, onShare, ...rest }) => {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        toast.error('Unable to share right now.');
      }
    } else {
      // Fallback for browsers that do not support the Web Share API
      if (shareData.url) {
        navigator.clipboard.writeText(shareData.url)
          .then(() => toast.success('Link copied to clipboard!'))
          .catch(() => toast.error('Failed to copy link.'));
      } else {
        toast.error('Sharing is not supported on this browser.');
      }
    }
    if (onShare) {
        onShare();
    }
  };

  return (
    <button onClick={handleShare} className={className} {...rest}>
      {children}
    </button>
  );
};

export default ShareButton;
