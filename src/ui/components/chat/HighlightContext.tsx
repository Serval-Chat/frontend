import React, { createContext, use } from 'react';

const HighlightContext = createContext<string | null>(null);

export const HighlightProvider = ({
    highlightId,
    children,
}: {
    highlightId: string | null;
    children: React.ReactNode;
}) => (
    <HighlightContext.Provider value={highlightId}>
        {children}
    </HighlightContext.Provider>
);

// eslint-disable-next-line react-refresh/only-export-components
export const useHighlightId = (): string | null => use(HighlightContext);
