import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ViewType =
  | {
      view: 'dashboard' | 'createStudy';
    }
  | {
      view: 'studyDetails' | 'suggestTrials';
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
      state.data = action.payload;
      state.isVisible = true;
    },
    close: state => {
      state.isVisible = false;
    },
  },
});

export const { setView, close } = viewSlice.actions;
