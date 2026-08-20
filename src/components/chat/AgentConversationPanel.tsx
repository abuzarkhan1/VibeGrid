import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot } from 'lucide-react';
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
      content: 'Refactor the terminal panes, toolbar, and diff viewer with solid surfaces, zero gradients, and high-contrast code.',
      timestamp: '12:05 PM',
    },
    {
      id: '3',
      sender: 'agent',
      agentName: 'VibeGrid Supervisor',
      content: 'Applying solid dark theme. Implementing zero-gradient surfaces, crisp borders, and high-readability diff viewers.',
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
    <div className="flex flex-col h-full w-full bg-[#111111] border-l border-[#4a4b50] overflow-hidden font-sans select-none text-white">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#4a4b50] bg-[#111111]">
        <div className="flex items-center gap-2.5">
          <div className="h-2 w-2 rounded-full bg-[#5683da]" />
          <span className="text-xs font-bold text-white tracking-tight">Agent Conversation</span>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-[9999px] bg-[#303236] text-[#5683da] border border-[#4a4b50]">
            Claude 3.7 Sonnet
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close conversation panel"
            className="p-1 rounded-md bg-[#303236] hover:bg-[#4a4b50] border border-[#4a4b50] text-[#a9a9aa] hover:text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#111111]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#a9a9aa] space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#303236] border border-[#4a4b50] mb-1">
              <Bot className="w-6 h-6 text-[#5683da]" />
            </div>
            <p className="text-sm font-semibold text-white">No active conversation</p>
            <p className="text-xs text-[#a9a9aa] max-w-xs leading-relaxed mb-2">
              Send an instruction to automate multi-terminal workflows or analyze grid output.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-xs pt-1">
              {[
                'Inspect git diff',
                'Run multi-pane build',
                'Analyze terminal logs',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setInputText(suggestion)}
                  className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-[#303236] hover:bg-[#4a4b50] border border-[#4a4b50] text-[#a9a9aa] hover:text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))
        )}
        <div ref={scrollEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-[#4a4b50] bg-[#111111]">
        <div className="relative flex items-center rounded-xl bg-[#303236] border border-[#4a4b50] focus-within:border-[#5683da] focus-within:ring-1 focus-within:ring-[#5683da] transition-all">
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
            rows={2}
            className="w-full bg-transparent px-3.5 py-2.5 text-xs sm:text-[13px] text-white placeholder-[#a9a9aa]/50 resize-none focus:outline-none custom-scrollbar"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            aria-label="Send message"
            className="absolute right-2.5 bottom-2.5 p-1.5 rounded-lg bg-[#5683da] text-white hover:bg-[#5683da]/90 transition-all disabled:opacity-30 disabled:hover:bg-[#5683da] cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
