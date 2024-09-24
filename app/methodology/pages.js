// app/methodology/page.js

import React from 'react';
import Head from 'next/head';
import DynamicMethodology from '@/components/Methodology';

const MethodologyPage = () => {
  return (
    <>
      <Head>
        <title>Methodology - Yemen Market Analysis Dashboard</title>
        <meta name="description" content="Methodology used in Yemen Market Analysis." />
      </Head>
      <h1>Methodology</h1>
      <DynamicMethodology />
    </>
  );
};

export default MethodologyPage;