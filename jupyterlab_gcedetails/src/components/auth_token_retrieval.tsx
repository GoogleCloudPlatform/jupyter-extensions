export function authTokenRetrieval(): Promise<string> {
  // eslint-disable-next-line prefer-const
  let authPopup: any;
  const authOrigin = 'https://jupyterlab-interns-sandbox.uc.r.appspot.com';
  return new Promise<string>((resolve, reject) => {
    try {
      const listener = (message: MessageEvent) => {
        if (
          message.origin === authOrigin &&
          (message.data['error'] || message.data['credentials'])
        ) {
          authPopup.close();
          window.removeEventListener('message', listener);
          if (message.data['error']) {
            throw new Error();
          }
          resolve(message.data['credentials']);
        }
      };
      window.addEventListener('message', listener);
      authPopup = window.open(
        `${authOrigin}/authorize`,
        '_authPopup',
        'left=100,top=100,width=400,height=400'
      );
    } catch (err) {
      reject(err);
    }
  });
}
