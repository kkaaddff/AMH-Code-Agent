import React, { createContext, useContext, useState } from 'react';

interface RequirementDocContextValue {
  docContent: string;
  setDocContent: (content: string) => void;
}

const RequirementDocContext = createContext<RequirementDocContextValue | null>(null);

export const RequirementDocProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [docContent, setDocContent] = useState('');

  const value: RequirementDocContextValue = {
    docContent,
    setDocContent,
  };

  return <RequirementDocContext.Provider value={value}>{children}</RequirementDocContext.Provider>;
};

export const useRequirementDoc = () => {
  const context = useContext(RequirementDocContext);
  if (!context) {
    throw new Error('useRequirementDoc must be used within a RequirementDocProvider');
  }
  return context;
};
