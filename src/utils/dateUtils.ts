
export const timeAgo = (dateString: string | undefined): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  // Check for invalid date
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Handle future dates (client/server clock skew)
  if (diffInSeconds < 0) return 'just now';
  
  if (diffInSeconds < 60) return 'just now';
  
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  // For older dates within the current year
  const currentYear = now.getFullYear();
  if (date.getFullYear() === currentYear) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  
  // For dates in previous years
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatMessageTime = (dateString: string | undefined): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
};
