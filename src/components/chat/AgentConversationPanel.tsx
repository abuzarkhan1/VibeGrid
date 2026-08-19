import React, { useState, useRef, useEffect } from 'react';
import { Send, X } from 'lucide-react';
import { ChatMessage, MessageItem } from './ChatMessage';

interface AgentConversationPanelProps {
  onClose?: () => void;
}

export const AgentConversationPanel: React.FC<AgentConversationPanelProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: '1',
      sender: 'agent',
      agentName: 'VibeGrid Supervisor',
      content: 'Agent fleet initialized. All 4 terminal panes connected to PTY context.',
      timestamp: '12:04 PM',
      codeBlocks: [
        {
          language: 'bash',
          filename: 'grid-fleet.sh',
          code: 'vibegrid fleet --panes=4 --model=claude-3-7-sonnet --role-pod=fullstack',
        },
      ],
    },
    {
      id: '2',
      sender: 'user',
      content: 'Refactor the overlay system with Functional Glassmorphism, 24px gaps, and high-contrast monospace code.',
      timestamp: '12:05 PM',
    },
    {
      id: '3',
      sender: 'agent',
      agentName: 'VibeGrid Supervisor',
      content: 'Applying Functional Glassmorphism. Implementing density scale, refraction edges, and high-readability diff viewers.',
      timestamp: '12:05 PM',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMsg: MessageItem = {
      id: Date.now().toString(),
      sender: 'user',
      content: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden font-sans select-none">
      {/* Glass Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <div className="h-2 w-2 rounded-full bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
          <span className="text-xs font-bold text-white/90 tracking-tight">Agent Conversation</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/60 border border-white/20">
            Claude 3.7 Sonnet
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close conversation panel"
            className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Message Timeline Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        <div ref={scrollEndRef} />
      </div>

      {/* Glassmorphic Prompt Input Area */}
      <div className="p-3 border-t border-white/10 bg-white/[0.02]">
        <div className="relative flex items-center rounded-xl bg-white/[0.04] border border-white/10 focus-within:border-white/40 focus-within:ring-1 focus-within:ring-white/20 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Instruct agent or execute workflow..."
            rows={1}
            className="w-full px-3.5 py-2.5 text-xs text-white/90 placeholder:text-white/30 bg-transparent resize-none focus:outline-none max-h-28 font-sans"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="mr-2 p-1.5 rounded-lg bg-white hover:bg-white/90 disabled:opacity-30 text-black transition-all shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};