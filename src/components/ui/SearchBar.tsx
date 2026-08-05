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
    if (searchAddon && term) {
      searchAddon.findNext(term, { incremental: true });
    }
  };

  const handleNext = () => {
    if (searchAddon && searchTerm) {
      searchAddon.findNext(searchTerm);
    }
  };

  const handlePrev = () => {
    if (searchAddon && searchTerm) {
      searchAddon.findPrevious(searchTerm);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      if (e.shiftKey) {
        handlePrev();
      } else {
        handleNext();
      }
    }
  };

  return (
    <div className="absolute top-2 right-4 z-30 flex items-center gap-1.5 p-1.5 rounded-lg bg-surfaceCard border border-white/10 shadow-lg shadow-black/40 backdrop-blur-md text-xs animate-fade-in">
      <Search className="w-3.5 h-3.5 text-forest-bright ml-1 shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search terminal... (Esc to close)"
        className="w-48 bg-transparent text-white/90 placeholder-white/30 focus:outline-none text-xs"
      />

      <button
        onClick={handlePrev}
        title="Previous Match (Shift+Enter)"
        aria-label="Previous match"
        className="p-1 rounded hover:bg-white/5 text-white/45 hover:text-white/80 transition-colors"
      >
        <ChevronUp className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={handleNext}
        title="Next Match (Enter)"
        aria-label="Next match"
        className="p-1 rounded hover:bg-white/5 text-white/45 hover:text-white/80 transition-colors"
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={onClose}
        title="Close Search (Escape)"
        aria-label="Close search"
        className="p-1 rounded hover:bg-rose-950/60 text-white/45 hover:text-rose-400 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
