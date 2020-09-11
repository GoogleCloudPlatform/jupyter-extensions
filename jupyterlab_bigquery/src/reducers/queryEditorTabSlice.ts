import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { QueryResult } from '../components/query_editor/query_text_editor/query_text_editor';
import { UUID } from '@phosphor/coreutils';

export interface QueryEditorState {
  queries: { [key: string]: QueryResult };
}

export type QueryId = string;

const DEFAULT_INIT_QUERY_STATE = {
  labels: [],
  bytesProcessed: null,
  queryId: null,
  project: null,
  query: null,
  contentLen: 0,
};

const initialState: QueryEditorState = {
  queries: {},
};

export function generateQueryId() {
  return UUID.uuid4();
}

const queryEditorTabSlice = createSlice({
  name: 'queryEditorTab',
  initialState,
  reducers: {
    updateQueryResult(state, action: PayloadAction<QueryResult>) {
      const queryResult = action.payload;
      const queryId = queryResult.queryId;
      const newQueryState = state.queries[queryId];

      newQueryState.labels = queryResult.labels;
      newQueryState.bytesProcessed = queryResult.bytesProcessed;
      newQueryState.queryId = queryId;
      newQueryState.query = queryResult.query;
      newQueryState.project = queryResult.project;
      newQueryState.contentLen = queryResult.contentLen;
      newQueryState.duration = queryResult.duration;
      newQueryState.queryFlags = queryResult.queryFlags;

      state.queries = { ...state.queries, [queryId]: newQueryState };
    },
    resetQueryResult(state, action: PayloadAction<QueryId>) {
      const queryId = action.payload;
      const newQueryState = Object.assign(
        {},
        DEFAULT_INIT_QUERY_STATE
      ) as QueryResult;
      newQueryState.queryId = queryId;
      state.queries = { ...state.queries, [queryId]: newQueryState };
    },
    deleteQueryEntry(state, action: PayloadAction<QueryId>) {
      const queryId = action.payload;
      delete state.queries[queryId];
    },
  },
});

export const {
  updateQueryResult,
  resetQueryResult,
  deleteQueryEntry,
} = queryEditorTabSlice.actions;

export default queryEditorTabSlice.reducer;
