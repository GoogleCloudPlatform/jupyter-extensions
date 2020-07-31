export function AuthTokenRetrieval(callback: (err, credentials) => void) {
  // eslint-disable-next-line prefer-const
  let authPopup: any;
  const authOrigin = 'https://jupyterlab-interns-sandbox.uc.r.appspot.com';
  const listener = (message: MessageEvent) => {
    if (
      message.origin === authOrigin &&
      (message.data['error'] || message.data['credentials'])
    ) {
      authPopup.close();
      window.removeEventListener('message', listener);
      callback(message.data['error'], message.data['credentials']);
    }
  };
  window.addEventListener('message', listener);
  authPopup = window.open(
    `${authOrigin}/authorize`,
    '_authPopup',
    'left=100,top=100,width=400,height=400'
  );
}
