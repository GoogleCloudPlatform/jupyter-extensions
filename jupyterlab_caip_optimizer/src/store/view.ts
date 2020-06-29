import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ViewType =
  | {
      view: 'dashboard' | 'createStudy';
    }
  | {
      view: 'studyDetails';
      studyId: string;
    };

export type ViewState = { data: ViewType; isVisible: boolean };

export const viewSlice = createSlice({
  name: 'view',
  initialState: {
    data: { view: 'dashboard' },
    isVisible: false,
  } as ViewState,
  reducers: {
    setView: (state, action: PayloadAction<ViewType>) => {
      if (action.payload.view === 'studyDetails') {
        state.data = {
          view: 'studyDetails',
          studyId: action.payload.studyId,
        };
      } else {
        state.data = action.payload;
      }
      state.isVisible = true;
    },
    close: state => {
      state.isVisible = false;
    },
  },
});

export const { setView, close } = viewSlice.actions;
