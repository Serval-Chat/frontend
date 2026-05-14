import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';

import type { AppDispatch, RootState } from './index';

export const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppShallowSelector = <TSelected>(
    selector: (state: RootState) => TSelected,
): TSelected => useSelector(selector, shallowEqual);
