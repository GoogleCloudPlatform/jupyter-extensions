import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Study, AsyncState } from '../types';
import { OptimizerService } from '../service/optimizer';
import { ServerProxyTransportService } from 'gcp_jupyterlab_shared';
import { RootState } from './store';

const optimizer = new OptimizerService(new ServerProxyTransportService());

export const fetchStudies = createAsyncThunk<
  Study[],
  undefined,
  {
    state: RootState;
  }
>('studies/fetch', async (_, thunkAPI) => {
  const metadata = thunkAPI.getState().metadata.data;
  if (!metadata) {
    console.error('No Metadata found.');
    throw new TypeError('No metadata');
  }
  return optimizer.listStudy(metadata);
});

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
    });
    builder.addCase(createStudy.rejected, (state, action) => {
      state.loading = false;
      state.error = 'Failed to create the study!';
    });
  },
});
