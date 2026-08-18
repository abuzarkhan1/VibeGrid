import React from 'react';
import { Bot, User } from 'lucide-react';
import { ChatCodeBlock } from './ChatCodeBlock';

export interface MessageItem {
  id: string;
  sender: 'user' | 'agent';
  agentName?: string;
  agentAvatar?: string;
  content: string;
  timestamp: string;
  codeBlocks?: Array<{ language: string; code: string; filename?: string }>;
  isStreaming?: boolean;
}

export const ChatMessage: React.FC<{ message: MessageItem }> = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex w-full gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      {/* Agent Avatar */}
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white/80 shadow-sm mt-0.5">
          <Bot className="w-4 h-4" />
        </div>
      )}

      {/* Message Bubble Container */}
      <div className={`flex flex-col max-w-[88%] sm:max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Author / Timestamp Label */}
        <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] font-mono text-white/40">
          <span>{isUser ? 'You' : message.agentName || 'Codex Agent'}</span>
          <span>·</span>
          <span>{message.timestamp}</span>
        </div>

        {/* Bubble Surface: User message with solid white glass, Agent with stealth black glass */}
        <div
          className={`px-4 py-3 rounded-xl text-xs sm:text-[13px] leading-relaxed select-text font-sans backdrop-blur-md ${
            isUser
              ? 'rounded-tr-sm text-white bg-white/10 border border-white/20'
              : 'bg-black/40 border border-white/10 rounded-xl rounded-tl-sm text-white/90'
          }`}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>

          {/* Embedded Code Blocks */}
          {message.codeBlocks?.map((cb, idx) => (
            <ChatCodeBlock
              key={idx}
              language={cb.language}
              code={cb.code}
              filename={cb.filename}
            />
          ))}

          {/* Streaming Cursor */}
          {message.isStreaming && (
            <span className="inline-block w-1.5 h-3.5 bg-white ml-1 translate-y-0.5 animate-pulse" />
          )}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white/80 shadow-sm mt-0.5">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};