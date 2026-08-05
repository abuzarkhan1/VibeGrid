'use client';

import { useEffect } from 'react';

/**
 * Scroll-reveal hook — IntersectionObserver that flips `.vg-hidden`
 * elements to `vg-animate` (see `vg-in-*` keyframes in globals.css).
 */
export function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.vg-hidden');
    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.classList.remove('vg-hidden');
            el.classList.add('vg-animate');
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -48px 0px' }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}
