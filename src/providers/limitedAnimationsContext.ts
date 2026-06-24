import React, { use } from 'react';

export const LimitedAnimationsContext = React.createContext(false);

export const useLimitedAnimations = (): boolean =>
    use(LimitedAnimationsContext);
