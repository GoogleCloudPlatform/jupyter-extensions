import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { MetadataRequired } from '../types';
import { VizierService } from '../service/vizier_service';
import { ServerProxyTransportService } from 'gcp_jupyterlab_shared';
import { createSnack } from './snackbar';
import { wrapThunk } from './utils';

const vizier = new VizierService(new ServerProxyTransportService());

export const fetchMetadata = createAsyncThunk<MetadataRequired>(
  'metadata/fetch',
  wrapThunk(
    async () => {
      return vizier.getMetaData();
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
