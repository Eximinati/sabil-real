'use client';

import { Suspense } from 'react';
import { RouteProgress } from './route-progress';

export function GlobalRouteProgress() {
  return (
    <Suspense fallback={null}>
      <RouteProgress />
    </Suspense>
  );
}
