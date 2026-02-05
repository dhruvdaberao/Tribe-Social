import React from 'react';

interface MarkdownRendererProps {
  text: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ text }) => {
  const processText = (inputText: string): string => {
    // Links: [text](url)
    let processedText = inputText.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline break-all">$1</a>');
    // Bold: **text**
    processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Fix: *text* also renders as bold (per user request)
    processedText = processedText.replace(/\*([^\s][^*]*?)\*/g, '<strong>$1</strong>');
    // Simple URLs (that are not already in an href)
    processedText = processedText.replace(/(?<!href="|href=')https?:\/\/[^\s]+/g, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline break-all">${url}</a>`);

    return processedText;
  };

  return <div className="break-words break-all whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: processText(text) }} />;
};

export default MarkdownRenderer;