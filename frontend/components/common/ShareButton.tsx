import React from 'react';

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
        console.log('Content shared successfully');
      } catch (error) {
        console.error('Error sharing content:', error);
      }
    } else {
      // Fallback for browsers that do not support the Web Share API
      if (shareData.url) {
        navigator.clipboard.writeText(shareData.url)
          .then(() => alert('Link copied to clipboard!'))
          .catch(err => console.error('Failed to copy link:', err));
      } else {
        alert('Sharing is not supported on this browser.');
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