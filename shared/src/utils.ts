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

// Utility functions and types
/** Interface for an <option> inside a <select> */
export interface Option {
  text: string;
  value: string | number;
  disabled?: boolean;
}

/** Returns an option whose value matches the given value. */
export function findOptionByValue<T extends Option>(
  options: T[],
  value: string | number | undefined
): T | undefined {
  if (value === undefined) return undefined;
  return options.find(option => option.value === value);
}

/** Removes the item from the list if found */
export function removeFromList<T>(list: T[], value: T) {
  const index = list.indexOf(value);
  if (index >= 0) {
    list.splice(index, 1);
  }
}

/** Link to Cloud Console */
export const CLOUD_CONSOLE = 'https://console.cloud.google.com';
