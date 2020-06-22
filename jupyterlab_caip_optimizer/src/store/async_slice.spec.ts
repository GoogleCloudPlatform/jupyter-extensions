import { createAsyncSlice, AsyncState } from './async_slice';

describe('async slice reducer', () => {
  let genericSlice: ReturnType<typeof createAsyncSlice>;

  beforeEach(() => {
    genericSlice = createAsyncSlice({
      name: 'generic',
      initialState: {
        loading: false,
        error: null,
        data: undefined,
      },
      reducers: {},
    });
  });

  describe('start', () => {
    let initialState: AsyncState<unknown>;
    beforeEach(() => {
      initialState = {
        loading: false,
        error: 'AHHH error',
        data: 'DATA',
      };
    });
    it('starts loading', () => {
      const newState = genericSlice.reducer(
        initialState,
        genericSlice.actions.start()
      );
      expect(newState.loading).toBe(true);
    });
    it('does not change existing data', () => {
      const newState = genericSlice.reducer(
        initialState,
        genericSlice.actions.start()
      );
      expect(newState.data).toEqual(initialState.data);
    });
    it('does not change existing error', () => {
      const newState = genericSlice.reducer(
        initialState,
        genericSlice.actions.start()
      );
      expect(newState.error).toEqual(initialState.error);
    });
  });

  describe('success', () => {
    let initialState: AsyncState<unknown>;
    beforeEach(() => {
      initialState = {
        loading: true,
        error: 'AHHH error',
        data: undefined,
      };
    });
    it('stops loading', () => {
      const newState = genericSlice.reducer(
        initialState,
        genericSlice.actions.success('data')
      );
      expect(newState.loading).toBe(false);
    });
    it('sets data', () => {
      const newState = genericSlice.reducer(
        initialState,
        genericSlice.actions.success('data')
      );
      expect(newState.data).toEqual('data');
    });
    it('removes error', () => {
      const newState = genericSlice.reducer(
        initialState,
        genericSlice.actions.success('data')
      );
      expect(newState.error).toBeNull();
    });
  });
  describe('error', () => {
    let initialState: AsyncState<unknown>;
    beforeEach(() => {
      initialState = {
        loading: true,
        error: null,
        data: ['data'],
      };
    });
    it('stops loading', () => {
      const newState = genericSlice.reducer(
        initialState,
        genericSlice.actions.error('ERROR! FIRE')
      );
      expect(newState.loading).toBe(false);
    });
    it('does not change existing data', () => {
      const newState = genericSlice.reducer(
        initialState,
        genericSlice.actions.error('ERROR! FIRE')
      );
      expect(newState.data).toEqual(initialState.data);
    });
    it('sets the error message', () => {
      const errorMessage = 'ERROR! FIRE';
      const newState = genericSlice.reducer(
        initialState,
        genericSlice.actions.error(errorMessage)
      );
      expect(newState.error).toEqual(errorMessage);
    });
  });
});
