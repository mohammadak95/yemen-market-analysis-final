// app/literature-review/page.js

import React from 'react';
import Head from 'next/head';
import DynamicLiteratureReview from '@/components/LiteratureReview';

const LiteratureReviewPage = () => {
  return (
    <>
      <Head>
        <title>Literature Review - Yemen Market Analysis Dashboard</title>
        <meta name="description" content="Literature Review for Yemen Market Analysis." />
      </Head>
      <h1>Literature Review</h1>
      <DynamicLiteratureReview />
    </>
  );
};

export default LiteratureReviewPage;