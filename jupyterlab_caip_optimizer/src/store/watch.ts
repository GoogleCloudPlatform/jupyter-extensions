/**
 * Watches for changes in value in a redux store.
 * @param getState a function to get the current state.
 * @param select a function to get the value wanted.
 * @param same a function to see if the values are the same.
 */
export const watch = <STATE, V>(
  getState: () => STATE,
  select: (state: STATE) => V,
  same: (oldValue: V, newValue: V) => boolean
): ((updateFn: (selected: V, state: STATE) => void) => () => void) => {
  let previousState: V;
  return updateFn => {
    return () => {
      const state = getState();
      const newState = select(state);
      if (!same(previousState, newState)) {
        previousState = newState;
        updateFn(newState, state);
      }
    };
  };
};
