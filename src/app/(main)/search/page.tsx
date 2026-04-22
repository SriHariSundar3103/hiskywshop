'use client';

import { Suspense } from 'react';
import SearchContent from './search-content';

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container py-12"><div>Loading search...</div></div>}>
      <SearchContent />
    </Suspense>
  );
}

