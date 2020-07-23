import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  DataTree,
  Project,
  Dataset,
} from '../components/list_items_panel/service/list_items';

export interface DataTreeState {
  data: { projects: {}; projectIds: string[] };
}

const initialState: DataTreeState = {
  data: {
    projects: {},
    projectIds: [],
  },
};

const dataTreeSlice = createSlice({
  name: 'dataTree',
  initialState,
  reducers: {
    updateDataTree(state, action: PayloadAction<DataTree>) {
      const dataTreeResult = action.payload;
      state.data.projects = dataTreeResult.projects;
      state.data.projectIds = dataTreeResult.projectIds;
    },
    updateProject(state, action: PayloadAction<Project>) {
      const projectResult = action.payload;
      const projectId = projectResult.id;
      state.data.projects = {
        ...state.data.projects,
        [projectId]: projectResult,
      };
    },
    addProject(state, action: PayloadAction<Project>) {
      const projectResult = action.payload;
      const projectId = projectResult.id;
      if (!state.data.projects[projectId]) {
        state.data.projects = {
          ...state.data.projects,
          [projectId]: projectResult,
        };
        state.data.projectIds.push(projectId);
      }
    },
    updateDataset(state, action: PayloadAction<Dataset>) {
      const datasetResult = action.payload;
      const datasetId = datasetResult.id;
      const projectId = datasetResult.projectId;
      state.data.projects[projectId].datasets = {
        ...state.data.projects[projectId].datasets,
        [datasetId]: datasetResult,
      };
    },
  },
});

export const {
  updateDataTree,
  updateProject,
  updateDataset,
  addProject,
} = dataTreeSlice.actions;

export default dataTreeSlice.reducer;
