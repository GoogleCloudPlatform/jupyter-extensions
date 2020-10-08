/**
 * Waits for specified time.
 * @param ms Milliseconds to wait.
 */
export const waitMs = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(() => resolve(), ms));
