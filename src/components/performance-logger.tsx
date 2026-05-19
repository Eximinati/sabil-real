'use client';

import { useEffect, useRef } from 'react';

interface PerformanceLoggerProps {
  componentName: string;
  startTime?: number;
}

export function usePerformanceLogger(componentName: string, startTime?: number) {
  const mountTime = useRef(performance.now());
  
  useEffect(() => {
    const renderTime = performance.now() - (startTime || mountTime.current);
    
    if (process.env.NODE_ENV === 'development') {
      const styles = 'color: #10b981; font-weight: bold;';
      const groupStyles = 'color: #3b82f6; font-weight: bold;';
      
      console.group(`%c⚡ ${componentName} Rendered`, groupStyles);
      console.log(`%cRender time: ${renderTime.toFixed(2)}ms`, styles);
      console.log(`%cTimestamp: ${new Date().toISOString()}`, 'color: #6b7280;');
      console.groupEnd();
    }
    
    if (typeof window !== 'undefined') {
      (window as any).__sabil_perf = (window as any).__sabil_perf || {};
      (window as any).__sabil_perf[componentName] = renderTime;
    }
  }, [componentName, startTime]);
}

export function logStreamEvent(event: string, details?: Record<string, any>) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`%c[Stream] ${event}`, 'color: #8b5cf6; font-weight: bold;', details || '');
  }
}

export function getPerformanceMetrics() {
  if (typeof window !== 'undefined') {
    return (window as any).__sabil_perf || {};
  }
  return {};
}

export function clearPerformanceMetrics() {
  if (typeof window !== 'undefined') {
    (window as any).__sabil_perf = {};
  }
}