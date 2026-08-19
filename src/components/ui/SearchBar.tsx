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
    <div className="absolute top-3 right-4 z-30 flex items-center gap-1.5 p-2 rounded-2xl bg-[#181924] border border-white/10 shadow-2xl text-xs font-sans animate-fade-in select-none backdrop-blur-md">
      <Search className="w-4 h-4 text-white/50 ml-1.5 shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Find in terminal… (Esc to close)"
        className="w-52 bg-transparent text-white/90 placeholder:text-white/30 focus:outline-none text-xs font-sans px-1"
      />

      <div className="flex items-center gap-1 border-l border-white/10 pl-1.5 ml-0.5">
        <button
          onClick={handlePrev}
          title="Previous Match (Shift+Enter)"
          aria-label="Previous match"
          className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleNext}
          title="Next Match (Enter)"
          aria-label="Next match"
          className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onClose}
          title="Close Search (Escape)"
          aria-label="Close search"
          className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 text-white/60 hover:text-rose-300 transition-colors cursor-pointer ml-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
