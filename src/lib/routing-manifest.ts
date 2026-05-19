/**
 * SABIL RENDERING STRATEGY MANIFEST
 * 
 * This document defines the rendering philosophy for the entire platform.
 * All routes should follow these patterns consistently.
 * 
 * RENDERING TYPES:
 * - STATIC: Generated at build time, cached indefinitely
 * - ISR: Generated and cached with time-based revalidation
 * - DYNAMIC: Generated per-request, not cached
 * - STREAMING: Uses React Suspense for progressive loading
 * - CLIENT: Client-side only rendering
 * 
 * CACHING TIER:
 * - NONE: No caching
 * - API: Cached at API layer only
 * - PAGE: Cached at page level with revalidate
 * - CDN: Full CDN caching (static only)
 */

export interface RouteStrategy {
  type: 'STATIC' | 'ISR' | 'DYNAMIC' | 'STREAMING' | 'CLIENT';
  revalidate: number;
  caching: 'NONE' | 'API' | 'PAGE' | 'CDN';
  description: string;
  seo?: boolean;
  streaming?: boolean;
}

export const RENDERING_STRATEGY: Record<string, RouteStrategy> = {
  // PUBLIC PAGES
  '/': {
    type: 'STATIC',
    revalidate: 3600,
    caching: 'CDN',
    description: 'Landing page - static with embedded featured content',
    seo: true,
  },
  '/login': {
    type: 'CLIENT',
    revalidate: 0,
    caching: 'NONE',
    description: 'Auth page - client-side interactive',
  },
  '/register': {
    type: 'CLIENT',
    revalidate: 0,
    caching: 'NONE',
    description: 'Auth page - client-side interactive',
  },
  '/onboarding': {
    type: 'CLIENT',
    revalidate: 0,
    caching: 'NONE',
    description: 'Onboarding flow - client-side interactive',
  },
  
  // JOURNEY SYSTEM
  '/journey': {
    type: 'ISR',
    revalidate: 60,
    caching: 'PAGE',
    description: 'Journey overview - semi-static with user progress',
    streaming: false,
  },
  '/journey/[day]': {
    type: 'STREAMING',
    revalidate: 60,
    caching: 'PAGE',
    description: 'Lesson detail - streaming with Suspense',
    streaming: true,
  },
  '/journey/reflections': {
    type: 'DYNAMIC',
    revalidate: 0,
    caching: 'NONE',
    description: 'User reflections - fully personalized',
  },
  
  // QURAN SYSTEM
  '/quran': {
    type: 'ISR',
    revalidate: 3600,
    caching: 'CDN',
    description: 'Quran index - static metadata',
    seo: true,
  },
  '/quran/[id]': {
    type: 'ISR',
    revalidate: 300,
    caching: 'API',
    description: 'Chapter verses - cached with user preferences',
  },
  
  // SEARCH & REFERENCE
  '/search': {
    type: 'DYNAMIC',
    revalidate: 0,
    caching: 'NONE',
    description: 'Search - fully dynamic with cached metadata',
  },
  '/tafsir': {
    type: 'ISR',
    revalidate: 3600,
    caching: 'CDN',
    description: 'Tafsir selector - static metadata, dynamic content',
  },
  '/hadith': {
    type: 'DYNAMIC',
    revalidate: 0,
    caching: 'NONE',
    description: 'Hadith browser - fully dynamic',
  },
  
  // USER DATA
  '/bookmarks': {
    type: 'DYNAMIC',
    revalidate: 0,
    caching: 'NONE',
    description: 'User bookmarks - fully personalized',
  },
  '/settings': {
    type: 'DYNAMIC',
    revalidate: 0,
    caching: 'NONE',
    description: 'User settings - fully personalized',
  },
} as const;

export type RouteKey = keyof typeof RENDERING_STRATEGY;

export function getRouteStrategy(pathname: string): typeof RENDERING_STRATEGY['/'] {
  // Check exact match first
  if (RENDERING_STRATEGY[pathname as RouteKey]) {
    return RENDERING_STRATEGY[pathname as RouteKey];
  }
  
  // Check dynamic routes
  if (pathname.startsWith('/journey/') && pathname !== '/journey') {
    return RENDERING_STRATEGY['/journey/[day]'];
  }
  
  if (pathname.startsWith('/quran/') && pathname !== '/quran') {
    return RENDERING_STRATEGY['/quran/[id]'];
  }
  
  // Default fallback
  return {
    type: 'DYNAMIC',
    revalidate: 0,
    caching: 'NONE',
    description: 'Default dynamic route',
  };
}