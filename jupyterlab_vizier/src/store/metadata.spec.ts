import { metadataSlice, fetchMetadata, MetadataState } from './metadata';

describe('metadata reducer', () => {
  describe('fetchMetadata', () => {
    const mockState: MetadataState = {
      data: undefined,
    };

    it('sets the metadata on success', () => {
      const metadata = {
        projectId: 'project',
        region: 'region-name',
      };
      const newState = metadataSlice.reducer(
        mockState,
        fetchMetadata.fulfilled(metadata, undefined, undefined)
      );
      expect(newState).toEqual({
        data: metadata,
      });
    });
  });
});
