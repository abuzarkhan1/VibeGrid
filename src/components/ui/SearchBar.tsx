import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';
import { SearchAddon } from '@xterm/addon-search';

interface SearchBarProps {
  searchAddon: SearchAddon | null;
  onClose: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ searchAddon, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term) {
      searchAddon?.clearDecorations();
      return;
    }
    searchAddon?.findNext(term, {
      decorations: {
        matchBackground: 'rgba(251, 191, 36, 0.35)',
        matchBorder: '#FBBF24',
        matchOverviewRuler: '#FBBF24',
        activeMatchBackground: 'rgba(74, 222, 128, 0.5)',
        activeMatchBorder: '#4ADE80',
        activeMatchColorOverviewRuler: '#4ADE80',
      },
    });
  };

  const handleNext = () => {
    if (searchTerm) {
      searchAddon?.findNext(searchTerm);
    }
  };

  const handlePrev = () => {
    if (searchTerm) {
      searchAddon?.findPrevious(searchTerm);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        handlePrev();
      } else {
        handleNext();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="absolute top-3 right-4 z-30 flex items-center gap-2 p-2 rounded-2xl bg-[#111111] border border-[#4a4b50] shadow-2xl text-xs font-sans animate-fade-in select-none text-white max-w-[calc(100%-1.5rem)]">
      <div className="relative flex items-center min-w-0 flex-1">
        <Search className="w-3.5 h-3.5 text-[#5683da] absolute left-2.5 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Find in terminal… (Esc)"
          className="w-56 min-w-0 max-w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-[#303236] border border-[#4a4b50] text-white placeholder-[#a9a9aa]/50 focus:outline-none focus:border-[#5683da] focus:ring-1 focus:ring-[#5683da] text-xs font-sans transition-colors"
        />
      </div>

      <div className="flex items-center gap-1 border-l border-[#4a4b50] pl-2 shrink-0">
        <button
          onClick={handlePrev}
          disabled={!searchTerm}
          title="Previous Match (Shift+Enter)"
          aria-label="Previous match"
          className="p-1.5 rounded-full bg-[#303236] hover:bg-[#4a4b50] border border-[#4a4b50] text-[#a9a9aa] hover:text-white transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleNext}
          disabled={!searchTerm}
          title="Next Match (Enter)"
          aria-label="Next match"
          className="p-1.5 rounded-full bg-[#303236] hover:bg-[#4a4b50] border border-[#4a4b50] text-[#a9a9aa] hover:text-white transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onClose}
          title="Close Search (Escape)"
          aria-label="Close search"
          className="p-1.5 rounded-full bg-[#303236] hover:bg-[#ff8964]/20 border border-[#4a4b50] hover:border-[#ff8964]/40 text-[#a9a9aa] hover:text-[#ff8964] transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
