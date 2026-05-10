import React, { createContext, useContext } from 'react';

const HighlightContext = createContext<string | null>(null);

export const HighlightProvider: React.FC<{
    highlightId: string | null;
    children: React.ReactNode;
}> = ({ highlightId, children }) => (
    <HighlightContext.Provider value={highlightId}>
        {children}
    </HighlightContext.Provider>
);

// eslint-disable-next-line react-refresh/only-export-components
export const useHighlightId = (): string | null => useContext(HighlightContext);
