/* eslint-disable @typescript-eslint/no-unused-vars */
class CacheManager {
  private static instance: CacheManager = undefined;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  static getInstance() {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }

    return CacheManager.instance;
  }

  register(): string {
    // TODO: implement register
    console.warn('Not implemented');
    return '';
  }

  put(id: string, key: string, val: any): void {
    // TODO: implement put
    console.warn('Not implemented');
  }

  get(id: string, key: string): any {
    // TODO: implement get
    console.warn('Not implemented');
  }

  flush(id: string): void {
    // TODO: implement flush
    console.warn('Not implemented');
  }

  configure(): void {
    console.warn('Not implemented');
  }
}

export default CacheManager;
