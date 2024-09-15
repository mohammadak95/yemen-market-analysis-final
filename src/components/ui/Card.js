import React from 'react';

export function Card({ className, children }) {
  return <div className={`bg-white shadow rounded-lg ${className}`}>{children}</div>;
}

export function CardHeader({ children }) {
  return <div className="px-4 py-5 border-b border-gray-200 sm:px-6">{children}</div>;
}

export function CardContent({ children }) {
  return <div className="px-4 py-5 sm:p-6">{children}</div>;
}
