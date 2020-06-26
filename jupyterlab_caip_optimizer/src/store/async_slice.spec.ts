import { createAsyncSlice, AsyncState } from './async_slice';

describe('async slice reducer', () => {
  const genericSlice = createAsyncSlice({
    name: 'generic',
    initialState: {
      loading: false,
      error: null,
      data: undefined,
    },
    reducers: {},
  });

  describe('start', () => {
    let newState: AsyncState<unknown>;
    const initialState: AsyncState<unknown> = {
      loading: false,
      error: 'AHHH error',
      data: 'DATA',
    };
    beforeEach(() => {
      newState = genericSlice.reducer(
        initialState,
        genericSlice.actions.start()
      );
    });
    it('starts loading', () => {
      expect(newState.loading).toBe(true);
    });
    it('does not change existing data', () => {
      expect(newState.data).toEqual(initialState.data);
    });
    it('does not change existing error', () => {
      expect(newState.error).toEqual(initialState.error);
    });
  });

  describe('success', () => {
    let newState: AsyncState<unknown>;
    const initialState: AsyncState<unknown> = {
      loading: true,
      error: 'AHHH error',
      data: undefined,
    };
    beforeEach(() => {
      newState = genericSlice.reducer(
        initialState,
        genericSlice.actions.success('data')
      );
    });
    it('stops loading', () => {
      expect(newState.loading).toBe(false);
    });
    it('sets data', () => {
      expect(newState.data).toEqual('data');
    });
    it('removes error', () => {
      expect(newState.error).toBeNull();
    });
  });
  describe('error', () => {
    let newState: AsyncState<unknown>;
    const initialState: AsyncState<unknown> = {
      loading: true,
      error: null,
      data: ['data'],
    };
    beforeEach(() => {
      newState = genericSlice.reducer(
        initialState,
        genericSlice.actions.error('ERROR! FIRE')
      );
    });
    it('stops loading', () => {
      expect(newState.loading).toBe(false);
    });
    it('does not change existing data', () => {
      expect(newState.data).toEqual(initialState.data);
    });
    it('sets the error message', () => {
      expect(newState.error).toEqual('ERROR! FIRE');
    });
  });
});
