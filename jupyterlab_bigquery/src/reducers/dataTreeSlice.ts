import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  DataTree,
  Project,
  Dataset,
} from '../components/list_items_panel/service/list_items';

export interface DataTreeState {
  data: DataTree;
}

/**
 * BigQuery Public Data project
 * https://cloud.google.com/bigquery/public-data
 */
export const PUBLIC_DATA_PROJECT: Project = {
  id: 'bigquery-public-data',
  name: 'bigquery-public-data',
};

const initialState: DataTreeState = {
  data: {
    projects: {
      [PUBLIC_DATA_PROJECT.id]: PUBLIC_DATA_PROJECT,
    },
    projectIds: [PUBLIC_DATA_PROJECT.id],
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
    removeProject(state, action: PayloadAction<Project>) {
      const projectResult = action.payload;
      const projectId = projectResult.id;
      if (state.data.projects[projectId]) {
        delete state.data.projects[projectId];
        state.data.projectIds = state.data.projectIds.filter(
          item => item !== projectId
        );
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
  removeProject,
} = dataTreeSlice.actions;

export default dataTreeSlice.reducer;
