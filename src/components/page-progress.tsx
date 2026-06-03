'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function PageProgress() {
  const pathname = usePathname();
  const barRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;

      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${progress})`;
      }
    };

    const handleScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        update();
      });
    };

    update();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', update);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', update);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [pathname]);

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.transform = 'scaleX(0)';
    }
  }, [pathname]);

  return (
    <div
      ref={barRef}
      className="fixed top-0 left-0 right-0 h-[2px] z-[100] origin-left bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] will-change-transform"
      style={{ transform: 'scaleX(0)' }}
      role="progressbar"
      aria-valuenow={0}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-hidden="true"
    />
  );
}
