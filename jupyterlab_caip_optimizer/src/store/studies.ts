import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Study,
  AsyncState,
  Trial,
  SuggestTrialsResponse,
  Measurement,
} from '../types';
import { OptimizerService } from '../service/optimizer';
import { ServerProxyTransportService } from 'gcp_jupyterlab_shared';
import { RootState, AppDispatch } from './store';
import { wrapThunk } from './utils';
import { createSnack } from './snackbar';
import { waitMs } from '../utils/wait';

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
      const studyListWithDetails: Study[] = await Promise.all(
        studyList.map(paritalStudy =>
          optimizer.getStudy(paritalStudy.name, metadata)
        )
      );
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

export const fetchTrials = createAsyncThunk<
  Trial[],
  string,
  {
    state: RootState;
  }
>(
  'studies/fetchTrials',
  wrapThunk(
    async (rawStudyName, thunkAPI) => {
      const metadata = thunkAPI.getState().metadata.data;
      if (!metadata) {
        console.error('No Metadata found.');
        throw new TypeError('No metadata');
      }
      return await optimizer.listTrials(rawStudyName, metadata);
    },
    {
      error: dispatch =>
        dispatch(createSnack('Failed to fetch the trials!', 'error')),
    }
  )
);

export const completeTrial = createAsyncThunk<
  Trial,
  { trialName: string; studyName: string; finalMeasurement: Measurement },
  {
    state: RootState;
  }
>(
  'studies/completeTrial',
  wrapThunk(
    async ({ trialName, studyName, finalMeasurement }, thunkAPI) => {
      const metadata = thunkAPI.getState().metadata.data;
      if (!metadata) {
        console.error('No Metadata found.');
        throw new TypeError('No metadata');
      }
      return await optimizer.completeTrial(
        trialName,
        studyName,
        finalMeasurement,
        metadata
      );
    },
    {
      success: dispatch => dispatch(createSnack('Trial Completed!', 'success')),
      error: dispatch =>
        dispatch(createSnack('Failed to complete the trial!', 'error')),
    }
  )
);

export const deleteTrial = createAsyncThunk<
  void,
  { trialName: string; studyName: string },
  {
    state: RootState;
  }
>(
  'studies/deleteTrial',
  wrapThunk(
    async ({ trialName, studyName }, thunkAPI) => {
      const metadata = thunkAPI.getState().metadata.data;
      if (!metadata) {
        console.error('No Metadata found.');
        throw new TypeError('No metadata');
      }
      await optimizer.deleteTrial(trialName, studyName, metadata);
    },
    {
      error: dispatch =>
        dispatch(createSnack('Failed to delete the trial!', 'error')),
    }
  )
);

function replaceOrAddTrial(
  study: Study,
  trial: Trial,
  findFn: (a: Trial) => boolean
): void {
  if (Array.isArray(study.trials)) {
    const index = study.trials.findIndex(findFn);
    if (index >= 0) {
      study.trials[index] = trial;
    } else {
      study.trials.push(trial);
    }
  }
}

export const studiesSlice = createSlice({
  name: 'studies',
  initialState: {
    loading: false,
    data: undefined,
    error: null,
  } as AsyncState<Study[]>,
  reducers: {
    replaceOrAddTrial: (
      state,
      action: PayloadAction<{ studyName: string; trial: Trial }>
    ) => {
      const study = state.data?.find(
        study => study.name === action.payload.studyName
      );
      if (study) {
        if (!study.trials) {
          study.trials = [];
        }
        replaceOrAddTrial(
          study,
          action.payload.trial,
          trial => trial.name === action.payload.trial.name
        );
      } else {
        console.warn('No study found.');
      }
    },
  },
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
    // Fetch Trials
    builder.addCase(fetchTrials.fulfilled, (state, action) => {
      const study = state.data?.find(study => study.name === action.meta.arg);
      if (study) {
        study.trials = action.payload;
      } else {
        console.warn('Study not found in list while fetching trials.');
      }
      state.error = undefined;
    });
    builder.addCase(fetchTrials.rejected, (state, action) => {
      state.error = 'Failed to fetch the trials!';
    });
    // Complete Trial
    builder.addCase(completeTrial.fulfilled, (state, action) => {
      state.error = undefined;
      const study = state.data?.find(
        study => study.name === action.meta.arg.studyName
      );
      if (study) {
        const trialIndex = study.trials?.findIndex(
          trial => trial.name === action.meta.arg.trialName
        );
        if (trialIndex >= 0) {
          study.trials[trialIndex] = action.payload;
        } else {
          console.warn('Trial not found.');
        }
      } else {
        console.warn('Study not found in list while fetching trials.');
      }
    });
    // Delete Trial
    builder.addCase(deleteTrial.fulfilled, (state, action) => {
      state.error = undefined;
      const trials = state.data?.find(
        study => study.name === action.meta.arg.studyName
      )?.trials;
      if (trials) {
        const foundIndex = trials.findIndex(
          trial => trial.name === action.meta.arg.trialName
        );
        if (foundIndex >= 0) {
          trials.splice(foundIndex, 1);
        } else {
          console.warn('Can not find trial to delete.');
        }
      }
    });
  },
});

export const requestAndGetSuggestedTrial = ({
  studyName,
  suggestionCount,
  trys = 10,
  interval = 5000,
}: {
  studyName: string;
  suggestionCount: number;
  trys?: number;
  interval?: number;
}) => async (dispatch: AppDispatch, getState: () => RootState) => {
  const metadata = getState().metadata.data;
  if (!metadata) {
    console.error('No Metadata found.');
    throw new TypeError('No metadata');
  }

  dispatch(createSnack('Loading suggested trials.', 'info', trys * interval));

  const longRunningOperation = await optimizer.suggestTrials(
    suggestionCount,
    studyName,
    metadata
  );

  let suggestedTrials: Trial[] | null = null;
  let count = 0;

  do {
    count++;
    const operationResponse = await optimizer.getOperation<
      SuggestTrialsResponse
    >(longRunningOperation.name, metadata);
    if (
      operationResponse.done &&
      'response' in operationResponse &&
      !!operationResponse.response.trials
    ) {
      suggestedTrials = operationResponse.response.trials;
    } else if (count < trys) {
      await waitMs(interval as number);
    }
  } while (suggestedTrials === null && count <= trys);

  if (suggestedTrials === null) {
    dispatch(createSnack('Failed to load suggested trials.', 'error'));
  } else {
    suggestedTrials.forEach(trial =>
      dispatch(studiesSlice.actions.replaceOrAddTrial({ studyName, trial }))
    );
    dispatch(
      createSnack('Successfully loaded suggest trials.', 'success', 4000)
    );
  }
};
