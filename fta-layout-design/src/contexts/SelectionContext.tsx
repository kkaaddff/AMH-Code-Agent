import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SelectionContextType {
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  setSelectedNodeId: (nodeId: string | null) => void;
  setHoveredNodeId: (nodeId: string | null) => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export const useSelection = () => {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within SelectionProvider');
  }
  return context;
};

interface SelectionProviderProps {
  children: ReactNode;
}

export const SelectionProvider: React.FC<SelectionProviderProps> = ({ children }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  return (
    <SelectionContext.Provider
      value={{
        selectedNodeId,
        hoveredNodeId,
        setSelectedNodeId,
        setHoveredNodeId
      }}
    >
      {children}
    </SelectionContext.Provider>
  );
};