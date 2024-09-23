// src/config.js

const getBasePath = () => {
  if (typeof window !== 'undefined') {
    // Client-side
    return window.location.pathname.startsWith('/yemen-market-analysis-final')
      ? '/yemen-market-analysis-final'
      : '';
  }
  // Server-side
  return process.env.GITHUB_PAGES === 'true' ? '/yemen-market-analysis-final' : '';
};

export const basePath = getBasePath();