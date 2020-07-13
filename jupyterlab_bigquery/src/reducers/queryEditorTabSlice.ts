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
      state.queryResult.content = state.queryResult.content.concat(
        queryResult.content
      );
      state.queryResult.labels = queryResult.labels;
    },
    resetQueryResult(state, _) {
      state.queryResult.content = [];
      state.queryResult.labels = [];
    },
  },
});

export const {
  updateQueryResult,
  resetQueryResult,
} = queryEditorTabSlice.actions;

export default queryEditorTabSlice.reducer;
