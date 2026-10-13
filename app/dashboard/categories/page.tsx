'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const CategoryManager = dynamic(
  () =>
    import('@/libs/tts/modules/category/components/CategoryManager').then(
      (mod) => mod.CategoryManager
    ),
  { ssr: false }
);

export default function CategoriesPage() {
  return <CategoryManager />;
}
