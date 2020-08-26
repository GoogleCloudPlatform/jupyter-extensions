import { authTokenRetrieval } from './auth_token_retrieval';

describe('authTokenRetrieval', () => {
  const openWindowSpy = jest.spyOn(window, 'open');
  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
  });

  it('Returns credentials from popup', async () => {
    const mockClose = jest.fn();
    openWindowSpy.mockReturnValue(({
      close: mockClose,
    } as unknown) as Window);
    const tokenPromise = authTokenRetrieval();
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { credentials: 'AUTHTOKEN' },
        origin: 'https://jupyterlab-interns-sandbox.uc.r.appspot.com',
      })
    );
    const token = await tokenPromise;
    expect(token).toBe('AUTHTOKEN');
    expect(mockClose).toHaveBeenCalled();
  });

  it('Rejects if popup fails to get authentication token', async () => {
    const mockClose = jest.fn();
    openWindowSpy.mockReturnValue(({
      close: mockClose,
    } as unknown) as Window);
    expect.assertions(2);
    const tokenPromise = authTokenRetrieval().catch(err => {
      expect(err).toBe('Failed to get authentication token');
    });
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { error: 'Something bad' },
        origin: 'https://jupyterlab-interns-sandbox.uc.r.appspot.com',
      })
    );
    await tokenPromise;
    expect(mockClose).toHaveBeenCalled();
  });

  it('Rejects promise if popup is closed', async () => {
    openWindowSpy.mockReturnValue({
      closed: true,
    } as Window);
    expect.assertions(2);
    const tokenPromise = authTokenRetrieval().catch(err => {
      expect(err).toBe('User exited authentication flow');
    });
    expect(openWindowSpy).toHaveBeenCalledWith(
      'https://jupyterlab-interns-sandbox.uc.r.appspot.com/authorize',
      '_authPopup',
      'left=100,top=100,width=400,height=400'
    );
    jest.runOnlyPendingTimers();
    await tokenPromise;
  });
});
