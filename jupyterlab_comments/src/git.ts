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


/*
Send a request to the server
Params:
    handler = name of the handler route as defined in the jupyterlab_comments module
    method = GET or POST
    fileName = file path relative to the root of the Jupyter Lab server
    serverRoot = path to the root directory of the Jupyter Lab server
    body = for a POST request, should contain comments to upload

*/
export function httpGitRequest(handler : string, method : string, fileName : string, serverRoot : string, body? : Record<string, string>) : Promise<Response> {
    const setting = ServerConnection.makeSettings();
    const fullUrl = URLExt.join(setting.baseUrl, handler).concat("?", "file_path=", fileName, "&server_root=", serverRoot);

    let fullRequest : RequestInit;

    if (!body) {
        fullRequest = {
            method: method,
        };
    } else {
        fullRequest = {
            body: JSON.stringify(body),
            method: method,
        };
    }

    return ServerConnection.makeRequest(fullUrl, fullRequest, setting);

}
