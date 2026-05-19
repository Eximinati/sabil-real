'use client';

import { useEffect } from 'react';

export function PublicPageLogger({ pageName }: { pageName: string }) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const navStart = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');
      
      const fcp = paintEntries.find(e => e.name === 'first-contentful-paint');
      const lcp = paintEntries.find(e => e.name === 'largest-contentful-paint');
      
      console.group(`%c📄 ${pageName} Performance`, 'color: #3b82f6; font-weight: bold;');
      if (navStart) {
        console.log(`%cTTFB: ${(navStart.responseStart || 0).toFixed(0)}ms`, 'color: #10b981;');
      }
      if (fcp) {
        console.log(`%cFCP: ${fcp.startTime.toFixed(0)}ms`, 'color: #10b981;');
      }
      if (lcp) {
        console.log(`%cLCP: ${lcp.startTime.toFixed(0)}ms`, 'color: #10b981;');
      }
      console.log(`%cRender: ${performance.now().toFixed(0)}ms`, 'color: #6b7280;');
      console.groupEnd();
    }
  }, [pageName]);

  return null;
}