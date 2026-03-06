import { createContext, useContext } from 'react';

export const MobileSwipeContext = createContext<boolean>(false);

export const useMobileSwipeContext = (): boolean =>
    useContext(MobileSwipeContext);
