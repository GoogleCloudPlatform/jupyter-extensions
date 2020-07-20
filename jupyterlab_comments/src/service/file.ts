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

import * as path from 'path';

export class File {
  readonly filePath: string;
  readonly comments: any[];
  constructor(filePath: string) {
    this.filePath = filePath;
  }
}

//Extract the file name from the full file path
export function trimPath(filePath: string) {
  try {
    return path.basename(filePath);
  } catch (e) {
    console.log('Error trimming file path, returning untrimmed path.');
    return filePath;
  }
}
