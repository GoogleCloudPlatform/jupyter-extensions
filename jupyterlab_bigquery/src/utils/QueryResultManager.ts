class QueryResultManager {
  private static instance: QueryResultManager | undefined = undefined;
  private static queryResults: {};

  private constructor() {
    QueryResultManager.queryResults = {};
  }

  getInstance() {
    if (QueryResultManager.instance === undefined) {
      QueryResultManager.instance = new QueryResultManager();
    }
    return QueryResultManager.instance;
  }

  resetSlot(jobId: string) {
    QueryResultManager.queryResults[jobId] = [];
  }

  updateSlot(jobId: string, newBatch: []) {
    QueryResultManager.queryResults[jobId].cat(newBatch);
  }

  getSlot(jobId: string) {
    return QueryResultManager.queryResults[jobId];
  }

  getSlotSize(jobId: string) {
    return QueryResultManager.queryResults[jobId].length;
  }
}

export default QueryResultManager;
