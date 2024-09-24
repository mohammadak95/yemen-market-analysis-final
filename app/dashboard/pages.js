// app/dashboard/page.js

import React from 'react';
import Head from 'next/head';
import Dashboard from '@/components/Dashboard';

const DashboardPage = () => {
  return (
    <>
      <Head>
        <title>Dashboard - Yemen Market Analysis Dashboard</title>
        <meta name="description" content="Interactive Dashboard for Yemen Market Analysis." />
      </Head>
      <Dashboard />
    </>
  );
};

export default DashboardPage;