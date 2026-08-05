'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Animated count-up — counts from 0 to `target` with an ease-out curve
 * the first time the element scrolls into view (the live-stats
 * number animation). Respects prefers-reduced-motion (jumps to target).
 */
export default function CountUp({
  target,
  duration = 1.6,
  format = (n: number) => n.toLocaleString(),
  className = '',
  startDelay = 0,
}: {
  target: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
  startDelay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);
  const rafRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const run = () => {
      if (started.current) return;
      started.current = true;

      if (prefersReduced) {
        setValue(target);
        return;
      }

      const t0 = performance.now() + startDelay * 1000;
      const tick = (now: number) => {
        const elapsed = Math.max(0, now - t0);
        const p = Math.min(1, elapsed / (duration * 1000));
        // easeOutCubic
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(Math.round(target * eased));
        if (p < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            run();
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.4, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, startDelay]);

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}
