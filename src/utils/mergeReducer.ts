/**
 * a reducer that merges a partial patch into the current state.
 *
 * lets several related pieces of local component state be grouped under a single
 * `useReducer` call (instead of many `useState` calls) while keeping ergonomic,
 * field-level updates: `patch({ field: value })`. Group truly related state this
 * way; keep unrelated concerns in their own hooks.
 *
 * the patch may be an object or a function of the current state, mirroring
 * `useState`'s functional-update form so callers can compute the next value from
 * the freshest state (avoiding stale-closure bugs).
 *
 * @example
 * type FormState = { name: string; open: boolean };
 * const [state, patch] = useReducer(mergeReducer<FormState>, {
 *     name: '',
 *     open: false,
 * });
 * patch({ open: true });
 * patch((s) => ({ name: s.name + '!' }));
 */
export type MergePatch<S> = Partial<S> | ((state: S) => Partial<S>);

export const mergeReducer = <S extends object>(
    state: S,
    patch: MergePatch<S>,
): S => ({
    ...state,
    ...(typeof patch === 'function' ? patch(state) : patch),
});
