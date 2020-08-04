import { combineReducers } from 'redux';
import queryEditorTabReducer from './queryEditorTabSlice';
import dataTreeReducer from './dataTreeSlice';
import snackbarReducer from './snackbarSlice';

export default combineReducers({
  queryEditorTab: queryEditorTabReducer,
  dataTree: dataTreeReducer,
  snackbar: snackbarReducer,
});
