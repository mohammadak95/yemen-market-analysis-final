// File: src/components/GuidedTour.js

'use client';

import React from 'react';
import Joyride, { STATUS } from 'react-joyride';

const GuidedTour = ({ run, steps, onEnd }) => {
  const handleJoyrideCallback = (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      onEnd();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      disableOverlayClose
      disableScrolling
      spotlightClicks
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#3b82f6',
          textColor: '#374151',
          backgroundColor: '#ffffff',
        },
        tooltip: {
          borderRadius: '8px',
          fontSize: '14px',
        },
        buttonNext: {
          backgroundColor: '#3b82f6',
          color: '#ffffff',
          fontSize: '14px',
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#3b82f6',
          fontSize: '14px',
          marginRight: '8px',
        },
        buttonSkip: {
          color: '#6b7280',
          fontSize: '14px',
        },
      }}
      locale={{
        last: 'Finish',
        skip: 'Skip tour',
      }}
      callback={handleJoyrideCallback}
    />
  );
};

export default GuidedTour;