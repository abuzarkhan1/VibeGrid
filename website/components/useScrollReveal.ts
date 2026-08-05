'use client';

import { useEffect } from 'react';

/**
 * Scroll-reveal hook — IntersectionObserver that flips `.fb-hidden`
 * elements to `fb-animate` (see `fb-in-*` keyframes in globals.css).
 */
export function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.fb-hidden');
    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.classList.remove('fb-hidden');
            el.classList.add('fb-animate');
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
