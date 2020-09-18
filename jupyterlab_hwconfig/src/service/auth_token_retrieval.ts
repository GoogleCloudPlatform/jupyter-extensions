/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export function authTokenRetrieval(): Promise<string> {
  let authPopup: Window;
  let timer: number;
  const authOrigin = 'https://tokenserver-dot-beatrix-dev.uc.r.appspot.com';
  return new Promise<string>((resolve, reject) => {
    const listener = (message: MessageEvent) => {
      if (
        message.origin === authOrigin &&
        (message.data['error'] || message.data['credentials'])
      ) {
        authPopup.close();
        clearInterval(timer);
        window.removeEventListener('message', listener);
        if (message.data['error']) {
          reject('Failed to get authentication token');
        } else {
          resolve(message.data['credentials']);
        }
      }
    };
    window.addEventListener('message', listener);
    authPopup = window.open(
      `${authOrigin}/authorize`,
      '_authPopup',
      'left=100,top=100,width=400,height=400'
    );
    timer = window.setInterval(function() {
      if (authPopup.closed) {
        window.clearInterval(timer);
        window.removeEventListener('message', listener);
        reject('User exited authentication flow');
      }
    }, 1000);
  });
}
