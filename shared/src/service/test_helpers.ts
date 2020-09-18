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

import { ApiResponse } from './transport';

export const TEST_PROJECT = 'test-project';

/** Returns a Promise that resolves a JSON response akin to the fetch API */
export function asFetchResponse(result: any, ok = true): Promise<Response> {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(result),
  } as Response);
}

/** Wraps an object in the shape of a transport API response */
export function asApiResponse<T>(body: T): ApiResponse<T> {
  return { result: body };
}
