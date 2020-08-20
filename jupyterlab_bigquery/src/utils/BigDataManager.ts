class BigDataManager {
  private static queryResults: {
    [type: string]: { [id: string]: Array<unknown> };
  } = {};

  constructor(private readonly type: string) {
    if (!(this.type in BigDataManager.queryResults)) {
      BigDataManager.queryResults[this.type] = {};
    }
  }

  resetSlot(id: string) {
    this.getResults()[id] = [];
  }

  updateSlot(id: string, newBatch: Array<unknown>) {
    this.getResults()[id] = this.getResults()[id].concat(newBatch);
  }

  getSlot(id: string) {
    return this.getResults()[id];
  }

  getSlotSize(id: string) {
    const content = this.getResults()[id];
    return content !== undefined ? content.length : 0;
  }

  private getResults() {
    return BigDataManager.queryResults[this.type];
  }
}

export default BigDataManager;
