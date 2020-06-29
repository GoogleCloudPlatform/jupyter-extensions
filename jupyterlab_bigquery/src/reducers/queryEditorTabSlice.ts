import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { QueryResult } from '../components/query_editor/query_text_editor/service/query';

export interface QueryEditorState {
  queryResult: QueryResult;
}

const initialState: QueryEditorState = {
  queryResult: {
    content: [],
    labels: [],
  },
};

const queryEditorTabSlice = createSlice({
  name: 'queryEditorTab',
  initialState,
  reducers: {
    updateQueryResult(state, action: PayloadAction<QueryResult>) {
      const queryResult = action.payload;
      state.queryResult = queryResult;
    },
  },
});

export const { updateQueryResult } = queryEditorTabSlice.actions;

export default queryEditorTabSlice.reducer;
