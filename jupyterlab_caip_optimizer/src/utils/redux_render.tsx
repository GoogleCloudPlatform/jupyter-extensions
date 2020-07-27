import * as React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import { viewSlice } from '../store/view';
import { metadataSlice } from '../store/metadata';
import { snackbarSlice } from '../store/snackbar';
import { studiesSlice } from '../store/studies';
import {
  fakeStudy,
  fakeProjectId,
  fakeRegion,
} from '../service/test-constants';

export const reducer = {
  view: viewSlice.reducer,
  metadata: metadataSlice.reducer,
  snackbar: snackbarSlice.reducer,
  studies: studiesSlice.reducer,
};

export const initialState = {
  view: {
    data: { view: 'dashboard' },
    isVisible: false,
  },
  metadata: {
    data: { projectId: fakeProjectId, region: fakeRegion },
  },
  snackbar: {
    open: false,
    message: '',
    severity: 'info',
  },
  studies: {
    data: [fakeStudy],
    loading: false,
    error: undefined,
  },
};

function render(
  ui,
  {
    preloadedState = initialState,
    store = configureStore({
      reducer,
      middleware: getDefaultMiddleware(),
      devTools: false,
      preloadedState,
    }),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return <Provider store={store}>{children}</Provider>;
  }
  const renderValues = rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
  return { ...renderValues, getState: store.getState };
}

export * from '@testing-library/react';
export { render };
