import React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

export function Tabs({ children, ...props }) {
  return <TabsPrimitive.Root {...props}>{children}</TabsPrimitive.Root>;
}

export function TabsList({ children }) {
  return (
    <TabsPrimitive.List className="flex space-x-1 border-b border-gray-200">
      {children}
    </TabsPrimitive.List>
  );
}

export function TabsTrigger({ children, value }) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 focus:border-gray-700"
    >
      {children}
    </TabsPrimitive.Trigger>
  );
}

export function TabsContent({ children, value }) {
  return <TabsPrimitive.Content value={value}>{children}</TabsPrimitive.Content>;
}
