import { wrapThunk } from './utils';

describe('wrapThunk', () => {
  let success: jest.Mock;
  let error: jest.Mock;
  let thunk: jest.Mock;
  let dispatch: jest.Mock;
  let wrappedThunk: ReturnType<typeof wrapThunk>;
  beforeEach(() => {
    success = jest.fn();
    error = jest.fn();
    thunk = jest.fn();
    dispatch = jest.fn();
    wrappedThunk = wrapThunk(thunk, { success, error });
  });
  it('runs "success" on a fullfilled promise', async () => {
    thunk.mockResolvedValue(null);
    await wrappedThunk(undefined, { dispatch } as any);

    expect(success).toHaveBeenCalledWith(dispatch);
  });
  it('runs "error" on a reject promise', async () => {
    const errorMessage = 'Error!';
    thunk.mockRejectedValue(errorMessage);
    const run = async () => await wrappedThunk(undefined, { dispatch } as any);

    await expect(run()).rejects.toEqual(errorMessage);
    expect(error).toHaveBeenCalledWith(dispatch);
  });
});
