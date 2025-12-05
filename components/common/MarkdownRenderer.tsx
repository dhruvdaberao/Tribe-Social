import React from 'react';

interface MarkdownRendererProps {
  text: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ text }) => {
  const processText = (inputText: string): string => {
    // Links: [text](url)
    let processedText = inputText.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">$1</a>');
    // Bold: **text**
    processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Simple URLs (that are not already in an href)
    processedText = processedText.replace(/(?<!href="|href=')https?:\/\/[^\s]+/g, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${url}</a>`);
    
    return processedText;
  };

  return <span className="break-words" dangerouslySetInnerHTML={{ __html: processText(text) }} />;
};

export default MarkdownRenderer;