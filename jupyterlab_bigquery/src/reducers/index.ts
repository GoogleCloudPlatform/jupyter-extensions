import { combineReducers } from 'redux';
import queryEditorTabReducer from './queryEditorTabSlice';
import dataTreeReducer from './dataTreeSlice';

export default combineReducers({
  queryEditorTab: queryEditorTabReducer,
  dataTree: dataTreeReducer,
});
