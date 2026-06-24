import { createContext, use } from 'react';

export const MobileSwipeContext = createContext<boolean>(false);

export const useMobileSwipeContext = (): boolean => use(MobileSwipeContext);
