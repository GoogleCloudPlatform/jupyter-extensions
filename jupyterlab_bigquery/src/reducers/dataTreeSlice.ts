import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DataTree } from '../components/list_items_panel/service/list_items';

export interface DataTreeState {
  data: DataTree;
}

const initialState: DataTreeState = {
  data: {
    projects: [],
  },
};

const dataTreeSlice = createSlice({
  name: 'dataTree',
  initialState,
  reducers: {
    updateDataTree(state, action: PayloadAction<DataTree>) {
      const dataTreeResult = action.payload;
      state.data = dataTreeResult;
    },
  },
});

export const { updateDataTree } = dataTreeSlice.actions;

export default dataTreeSlice.reducer;
