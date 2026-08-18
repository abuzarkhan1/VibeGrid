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
        matchBackground: 'rgba(139, 92, 246, 0.4)',
        matchBorder: '#8B5CF6',
        matchOverviewRuler: '#8B5CF6',
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
    <div className="absolute top-2 right-4 z-30 flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#1A1B26] border border-white/15 shadow-2xl  text-xs font-sans animate-fade-in select-none">
      <Search className="w-3.5 h-3.5 text-violet-400 ml-1.5 shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search terminal... (Esc to close)"
        className="w-48 bg-transparent text-white/90 placeholder:text-white/40 focus:outline-none text-xs px-1"
      />

      <button
        onClick={handlePrev}
        title="Previous Match (Shift+Enter)"
        aria-label="Previous match"
        className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
      >
        <ChevronUp className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={handleNext}
        title="Next Match (Enter)"
        aria-label="Next match"
        className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={onClose}
        title="Close Search (Escape)"
        aria-label="Close search"
        className="p-1 rounded-lg hover:bg-rose-500/20 text-white/70 hover:text-red-400 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
