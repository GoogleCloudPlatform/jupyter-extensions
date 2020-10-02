class MockQueryResultsManager {
  slotSize = 0;
  constructor(slotSize: number) {
    this.slotSize = slotSize;
  }
  getSlotSize() {
    return this.slotSize;
  }
  getSlot() {
    return [];
  }

  resetSlot() {
    return undefined;
  }
}

export default MockQueryResultsManager;
