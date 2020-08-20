class BigDataManager {
  private static queryResults = {};

  constructor(private readonly className: string) {
    if (!(this.className in BigDataManager.queryResults)) {
      BigDataManager.queryResults[this.className] = {};
    }
  }

  resetSlot(jobId: string) {
    this.getResults()[jobId] = [];
  }

  updateSlot(jobId: string, newBatch: []) {
    this.getResults()[jobId].cat(newBatch);
  }

  getSlot(jobId: string) {
    return this.getResults()[jobId];
  }

  getSlotSize(jobId: string) {
    return this.getResults()[jobId].length;
  }

  private getResults() {
    return BigDataManager.queryResults[this.className];
  }
}

export default BigDataManager;
