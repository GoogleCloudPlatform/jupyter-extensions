import { studiesSlice, fetchStudies, createStudy } from './studies';
import { AsyncState, Study, Algorithm } from '../types';

describe('studies reducer', () => {
  describe('fetchStudies', () => {
    const mockState: AsyncState<any> = {
      data: undefined,
      error: null,
      loading: false,
    };
    it('intially starts loading', () => {
      const newState = studiesSlice.reducer(
        mockState,
        fetchStudies.pending(undefined)
      );
      expect(newState.loading).toBe(true);
    });
    it('sets the studies on success', () => {
      const studies = [
        {
          name: 'study name',
        },
      ];
      const newState = studiesSlice.reducer(
        mockState,
        fetchStudies.fulfilled(studies as any, undefined, undefined)
      );
      expect(newState).toEqual({
        loading: false,
        data: studies,
        error: null,
      });
    });

    it('sets an error message on error', () => {
      const newState = studiesSlice.reducer(
        mockState,
        fetchStudies.rejected(new Error('Error'), undefined)
      );
      expect(newState.loading).toBe(false);
      expect(newState.data).toBeUndefined();
      expect(newState.error).toMatchInlineSnapshot(
        `"Failed to load the studies!"`
      );
    });
  });

  describe('createStudy', () => {
    const mockState: AsyncState<any> = {
      data: undefined,
      error: null,
      loading: false,
    };
    it('intially starts loading', () => {
      const newState = studiesSlice.reducer(
        mockState,
        createStudy.pending(undefined, undefined)
      );
      expect(newState.loading).toBe(true);
    });
    it('adds the study to the list on success', () => {
      const newStudy = {
        name: 'test study',
        studyConfig: {
          parameters: [
            {
              doubleValueSpec: {
                maxValue: 10.0,
                minValue: -10.0,
              },
              parameter: 'x',
              type: 'DOUBLE',
            },
          ],
          metrics: [
            {
              goal: 'MAXIMIZE',
              metric: 'y',
            },
          ],
          algorithm: Algorithm.ALGORITHM_UNSPECIFIED,
        },
      } as Study;
      const newState = studiesSlice.reducer(
        mockState,
        createStudy.fulfilled(newStudy, undefined, undefined)
      );
      expect(newState).toEqual({
        loading: false,
        data: [newStudy],
        error: null,
      });
    });

    it('sets an error message on error', () => {
      const newState = studiesSlice.reducer(
        mockState,
        createStudy.rejected(new Error('Error'), undefined, undefined)
      );
      expect(newState.loading).toBe(false);
      expect(newState.data).toBeUndefined();
      expect(newState.error).toMatchInlineSnapshot(
        `"Failed to create the study!"`
      );
    });
  });
});
