import {
  studiesSlice,
  fetchStudies,
  createStudy,
  deleteStudy,
} from './studies';
import { AsyncState, Study } from '../types';
import { fakeStudy } from '../service/test-constants';

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
        fetchStudies.pending(undefined, undefined)
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
        error: undefined,
      });
    });

    it('sets an error message on error', () => {
      const newState = studiesSlice.reducer(
        mockState,
        fetchStudies.rejected(new Error('Error'), undefined, undefined)
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
          algorithm: 'ALGORITHM_UNSPECIFIED',
        },
      } as Study;
      const newState = studiesSlice.reducer(
        mockState,
        createStudy.fulfilled(newStudy, undefined, undefined)
      );
      expect(newState).toEqual({
        loading: false,
        data: [newStudy],
        error: undefined,
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

  describe('deleteStudy', () => {
    const mockState: AsyncState<any> = {
      data: [{}, fakeStudy, {}],
      error: 'error',
      loading: false,
    };
    it('removes the study from the list on success', () => {
      const newState = studiesSlice.reducer(
        mockState,
        deleteStudy.fulfilled(undefined, undefined, fakeStudy.name)
      );
      expect(newState).toEqual({
        loading: false,
        data: [{}, {}],
        error: undefined,
      });
    });

    it('sets an error message on error', () => {
      const newState = studiesSlice.reducer(
        mockState,
        deleteStudy.rejected(new Error('Error'), undefined, undefined)
      );
      expect(newState.loading).toBe(false);
      expect(newState.data).toEqual(mockState.data);
      expect(newState.error).toMatchInlineSnapshot(
        `"Failed to delete the study!"`
      );
    });
  });
});
