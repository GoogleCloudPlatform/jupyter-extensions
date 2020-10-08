import { viewSlice, ViewState, ViewType } from './view';

describe('view reducer', () => {
  describe('setView', () => {
    it('sets the view and shows it', () => {
      const initialState = {
        data: { view: 'createStudy' },
        isVisible: false,
      } as ViewState;

      const newView = {
        view: 'studyDetails',
        studyId: 'id',
      } as ViewType;

      const newState = viewSlice.reducer(
        initialState,
        viewSlice.actions.setView(newView)
      );

      expect(newState).toEqual({
        data: { view: 'studyDetails', studyId: 'id' },
        isVisible: true,
      });
    });
  });
  describe('close', () => {
    it('disables visiblity', () => {
      const initialState = {
        data: { view: 'dashboard' },
        isVisible: true,
      } as ViewState;

      const newState = viewSlice.reducer(
        initialState,
        viewSlice.actions.close()
      );

      expect(newState).toEqual({
        data: { view: 'dashboard' },
        isVisible: false,
      });
    });
  });
});
