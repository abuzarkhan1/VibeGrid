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
    <div className="bg-black/60 my-3 rounded-xl overflow-hidden text-xs border border-white/10 backdrop-blur-md">
      {}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/10 bg-black/80 select-none">
        <div className="flex items-center gap-2 text-white/80 font-mono text-[11px]">
          <Terminal className="w-3.5 h-3.5 text-white/60" />
          <span className="font-semibold">{filename || language || 'code'}</span>
        </div>
        <button
          onClick={handleCopy}
          aria-label="Copy code block"
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-white" />
              <span className="text-white font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {}
      <div className="p-3.5 overflow-x-auto font-mono text-[12px] leading-relaxed text-white/90 bg-black/40 selection:bg-white/30 selection:text-black">
        <pre><code>{code}</code></pre>
      </div>
    </div>
  );
};
