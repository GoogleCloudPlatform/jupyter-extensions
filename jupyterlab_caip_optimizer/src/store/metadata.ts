import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { MetadataRequired } from '../types';
import { OptimizerService } from '../service/optimizer';
import { ServerProxyTransportService } from 'gcp_jupyterlab_shared';

const optimizer = new OptimizerService(new ServerProxyTransportService());

export const fetchMetadata = createAsyncThunk<MetadataRequired>(
  'metadata/fetch',
  async () => {
    return optimizer.getMetaData();
  }
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
