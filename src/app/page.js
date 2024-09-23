'use client';

import React from 'react';
import Link from 'next/link';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const pathname = usePathname();
  const basePath = process.env.NODE_ENV === 'production' ? '/yemen-market-analysis-final' : '';

  return (
    <div>
      <nav className="bg-gray-800 p-4">
        <div className="container mx-auto flex justify-between">
          <Link href={`${basePath}/`} className="text-white font-bold">
            Yemen Market Analysis
          </Link>
          <Link href={`${basePath}/methodology`} className="text-white">
            Methodology
          </Link>
        </div>
      </nav>
      <Dashboard />
    </div>
  );
}