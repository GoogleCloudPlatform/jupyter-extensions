import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { MetadataRequired } from '../types';
import { OptimizerService } from '../service/optimizer';
import { ServerProxyTransportService } from 'gcp_jupyterlab_shared';
import { createSnack } from './snackbar';
import { wrapThunk } from './utils';

const optimizer = new OptimizerService(new ServerProxyTransportService());

export const fetchMetadata = createAsyncThunk<MetadataRequired>(
  'metadata/fetch',
  wrapThunk(
    async () => {
      return optimizer.getMetaData();
    },
    {
      error: dispatch =>
        dispatch(createSnack('Failed to load GCP Metadata!', 'error')),
    }
  )
);

export interface MetadataState {
  data?: MetadataRequired;
}

export const metadataSlice = createSlice({
  name: 'metadata',
  initialState: {
    data: undefined,
  } as MetadataState,
  reducers: {},
  extraReducers: builder => {
    builder.addCase(fetchMetadata.fulfilled, (state, action) => {
      state.data = action.payload;
    });
  },
});
