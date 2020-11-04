import { combineReducers } from 'redux';
import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import { studiesSlice } from './studies';
import { viewSlice } from './view';
import { snackbarSlice } from './snackbar';

const rootReducer = combineReducers({
  studies: studiesSlice.reducer,
  view: viewSlice.reducer,
  snackbar: snackbarSlice.reducer,
});

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk = ThunkAction<void, RootState, unknown, Action<string>>;

// A reusable hook that has resolved types
export const useAppDispatch = () => useDispatch<AppDispatch>();
