import React from 'react';

export const LimitedAnimationsContext = React.createContext(false);

export const useLimitedAnimations = (): boolean =>
    React.useContext(LimitedAnimationsContext);
