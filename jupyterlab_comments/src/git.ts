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

import { ServerConnection } from '@jupyterlab/services';
import { URLExt } from '@jupyterlab/coreutils';

//Send a request to the server
export function httpGitRequest(url : string, body : Record<string, any>, method : string, fileName : string, currentPath : string) {
    const setting = ServerConnection.makeSettings();
    console.log(setting.baseUrl);
    const fullUrl = URLExt.join(setting.baseUrl, url);
    console.log(fullUrl);
    let fullRequest : RequestInit = {
        body: JSON.string(params),
        method: method,
    }
    fullRequest = {
        body: JSON.stringify(params),
    };

    ServerConnection.makeRequest(fullUrl, fullRequest, setting).then(
        response => {
          response.json().then(content => {
            console.log("Returned by url request:");
            console.log(content);
        });
      });

}
