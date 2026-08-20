import React, { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';

interface ChatCodeBlockProps {
  language: string;
  code: string;
  filename?: string;
}

export const ChatCodeBlock: React.FC<ChatCodeBlockProps> = ({ language, code, filename }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#303236] my-3 rounded-xl overflow-hidden text-xs border border-[#4a4b50]">
      {/* Code Header */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#4a4b50] bg-[#111111] select-none">
        <div className="flex items-center gap-2 text-white font-mono text-[11px]">
          <Terminal className="w-3.5 h-3.5 text-[#5683da]" />
          <span className="font-semibold">{filename || language || 'code'}</span>
        </div>
        <button
          onClick={handleCopy}
          aria-label="Copy code block"
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono text-[#a9a9aa] hover:text-white bg-[#303236] hover:bg-[#4a4b50] border border-[#4a4b50] transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#5683da]" />
              <span className="text-[#5683da] font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-3.5 overflow-x-auto font-mono text-[12px] leading-relaxed text-white bg-[#303236] selection:bg-[#5683da]/40 selection:text-white">
        <pre><code>{code}</code></pre>
      </div>
    </div>
  );
};
