export function AuthTokenRetrieval(callback) {
  // eslint-disable-next-line prefer-const
  let authPopup: any;
  const oAuthHost =
    'https://jupyterlab-interns-sandbox.uc.r.appspot.com/authorize';
  const listener = (message: MessageEvent) => {
    authPopup.close();
    window.removeEventListener('message', listener);
    callback(message.data['error'], message.data['credentials']);
  };
  window.addEventListener('message', listener);
  authPopup = window.open(
    `${oAuthHost}/authorize`,
    '_authPopup',
    'left=100,top=100,width=400,height=400'
  );
}
