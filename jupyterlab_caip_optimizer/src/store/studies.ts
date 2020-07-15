import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Study, AsyncState } from '../types';
import { OptimizerService } from '../service/optimizer';
import { ServerProxyTransportService } from 'gcp_jupyterlab_shared';
import { RootState } from './store';
import { wrapThunk } from './utils';
import { createSnack } from './snackbar';

const optimizer = new OptimizerService(new ServerProxyTransportService());

export const fetchStudies = createAsyncThunk<
  Study[],
  undefined,
  {
    state: RootState;
  }
>(
  'studies/fetch',
  wrapThunk(
    async (_, thunkAPI) => {
      const metadata = thunkAPI.getState().metadata.data;
      if (!metadata) {
        console.error('No Metadata found.');
        throw new TypeError('No metadata');
      }
      const studyList = await optimizer.listStudy(metadata);
      const studyListWithDetails: Study[] = [];
      for (const paritalStudy of studyList) {
        studyListWithDetails.push(
          await optimizer.getStudy(paritalStudy.name, metadata)
        );
      }
      return studyListWithDetails;
    },
    {
      error: dispatch =>
        dispatch(createSnack('Failed to fetch studies!', 'error')),
    }
  )
);

export const createStudy = createAsyncThunk<
  Study,
  Study,
  {
    state: RootState;
  }
>('studies/create', async (study: Study, thunkAPI) => {
  const metadata = thunkAPI.getState().metadata.data;
  if (!metadata) {
    console.error('No Metadata found.');
    throw new TypeError('No metadata');
  }
  return optimizer.createStudy(study, metadata);
});

export const deleteStudy = createAsyncThunk<
  void,
  string,
  {
    state: RootState;
  }
>(
  'studies/delete',
  wrapThunk(
    async (rawStudyName, thunkAPI) => {
      const metadata = thunkAPI.getState().metadata.data;
      if (!metadata) {
        console.error('No Metadata found.');
        throw new TypeError('No metadata');
      }
      await optimizer.deleteStudy(rawStudyName, metadata);
    },
    {
      success: dispatch => dispatch(createSnack('Deleted study.', 'success')),
      error: dispatch =>
        dispatch(createSnack('Failed to delete the study!', 'error')),
    }
  )
);

export const studiesSlice = createSlice({
  name: 'studies',
  initialState: {
    loading: false,
    data: undefined,
    error: null,
  } as AsyncState<Study[]>,
  reducers: {},
  extraReducers: builder => {
    // Fetch Studies
    builder.addCase(fetchStudies.pending, state => {
      state.loading = true;
    });
    builder.addCase(fetchStudies.fulfilled, (state, action) => {
      state.loading = false;
      state.data = action.payload;
      state.error = undefined;
    });
    builder.addCase(fetchStudies.rejected, state => {
      state.loading = false;
      state.error = 'Failed to load the studies!';
    });
    // Create Study
    builder.addCase(createStudy.pending, state => {
      state.loading = true;
    });
    builder.addCase(createStudy.fulfilled, (state, action) => {
      state.loading = false;
      if (state.data === undefined) {
        state.data = [action.payload];
      } else {
        state.data.push(action.payload);
      }
      state.error = undefined;
    });
    builder.addCase(createStudy.rejected, (state, action) => {
      state.loading = false;
      state.error = 'Failed to create the study!';
    });
    // Delete Study
    builder.addCase(deleteStudy.fulfilled, (state, action) => {
      // Find index of studyName
      const index = state.data?.findIndex(
        study => study.name === action.meta.arg
      );
      // Delete from list if it exists
      if (index !== undefined) {
        state.data.splice(index, 1);
      }
      state.error = undefined;
    });
    builder.addCase(deleteStudy.rejected, (state, action) => {
      state.error = 'Failed to delete the study!';
    });
  },
});
