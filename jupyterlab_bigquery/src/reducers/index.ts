import { combineReducers } from 'redux';
import queryEditorTabReducer from './queryEditorTabSlice';

export default combineReducers({
  queryEditorTab: queryEditorTabReducer,
});
