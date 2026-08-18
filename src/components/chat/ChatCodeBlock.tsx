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
    <div className="bg-[#1A1B26] my-3 rounded-xl overflow-hidden text-xs">
      {/* Code Header Bar with High Contrast Backing */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/[0.08] bg-black/40 select-none">
        <div className="flex items-center gap-2 text-white/90 font-mono text-[11px]">
          <Terminal className="w-3.5 h-3.5 text-violet-400" />
          <span className="font-semibold">{filename || language || 'code'}</span>
        </div>
        <button
          onClick={handleCopy}
          aria-label="Copy code block"
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono text-white/70 hover:text-white/90 hover:bg-white/[0.08] transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content with Solid Dark Backing ensuring Syntax Highlighting Contrast */}
      <div className="p-3.5 overflow-x-auto font-mono text-[12px] leading-relaxed text-white/90 bg-black/40 selection:bg-violet-500/30 selection:text-white">
        <pre><code>{code}</code></pre>
      </div>
    </div>
  );
};
