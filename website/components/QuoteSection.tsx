'use client';

import React from 'react';
import { Star } from 'lucide-react';

export const QuoteSection: React.FC = () => {
  return (
    <section className="relative bg-black px-6 pt-24 pb-12 md:pt-32 md:pb-16">
      <figure className="mx-auto max-w-3xl text-center">
        <blockquote className="lp-serif text-balance text-[26px] italic leading-[1.3] text-white md:text-[38px] lg:text-[44px]">
          “VibeGrid made orchestrating 16 parallel AI subagent terminals a dream come true”
        </blockquote>
        <figcaption className="mt-7 text-sm tracking-wide text-white/55">
          — Alex Rivera, Lead Systems Engineer
        </figcaption>
        <div className="mt-7 flex items-center justify-center gap-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} className="flex h-7 w-7 items-center justify-center rounded-[3px] bg-[#2c7a40]">
                <Star className="h-4 w-4 fill-current text-white" />
              </span>
            ))}
          </div>
          <span className="text-sm font-normal tabular-nums text-white/70">1K+ Developers</span>
        </div>
      </figure>
    </section>
  );
};
