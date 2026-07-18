'use client';

import { createContext, useContext, useState } from 'react';

const OnboardingContext = createContext(undefined);

export function OnboardingProvider({ children }) {
  const [onboardingData, setOnboardingData] = useState(null);

  return (
    <OnboardingContext.Provider value={{ onboardingData, setOnboardingData }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}