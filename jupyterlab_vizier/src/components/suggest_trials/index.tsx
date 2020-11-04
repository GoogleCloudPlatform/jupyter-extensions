/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from 'react';
import { Box, Typography, Button } from '@material-ui/core';
import { fetchTrials } from '../../store/studies';
import { Study } from '../../types';
import { useSelector, useDispatch } from 'react-redux';
import { prettifyStudyName } from '../../service/vizier_service';
import { SuggestForm } from './suggest_form';
import { AddMeasurementDialog } from './add_measurement_dialog';
import { Trials } from './trials';
import { RootState } from '../../store/store';
import { setView } from '../../store/view';
import { CreateTrial } from './create_trial';
import { styles } from '../../utils/styles';
import ArrowBack from '@material-ui/icons/ArrowBack';

export interface MetricsInputs {
  [metricName: string]: string;
}

export interface ParameterInputs {
  [parameterName: string]: string;
}

interface Props {
  studyName: string;
}

export const SuggestTrials: React.FC<Props> = ({ studyName }) => {
  const dispatch = useDispatch();

  // Will refetch trials if studyName changes
  React.useEffect(() => {
    dispatch(fetchTrials(studyName));
  }, [studyName]);

  const { trials = [], studyConfig } = useSelector<RootState, Study>(state =>
    state.studies.data?.find(study => study.name === studyName)
  );

  const isActiveTrial = trials.some(trial => trial.state === 'ACTIVE');
  const [trialName, setTrialName] = React.useState<null | string>(null);
  const [openCustomTrial, setOpenCustomTrial] = React.useState(false);

  return (
    <>
      <Box className={styles.root} p={2}>
        <Box display="flex">
          <Typography variant="h4" gutterBottom>
            Trial Suggestions for "{prettifyStudyName(studyName)}"
          </Typography>
          <Box ml="auto">
            <Button
              variant="contained"
              color="primary"
              onClick={() =>
                dispatch(
                  setView({
                    view: 'studyDetails',
                    studyId: studyName,
                  })
                )
              }
              startIcon={<ArrowBack />}
            >
              Back To Study
            </Button>
          </Box>
        </Box>

        <Box display="flex" my={3}>
          <SuggestForm studyName={studyName} isActiveTrial={isActiveTrial} />
          <Box ml="auto">
            <Button
              variant="contained"
              color="primary"
              onClick={() => setOpenCustomTrial(true)}
            >
              Create Custom Trial
            </Button>
          </Box>
        </Box>

        <Box my={2}>
          <Trials
            studyName={studyName}
            studyConfig={studyConfig}
            trials={trials}
            openTrial={setTrialName}
          />
        </Box>
      </Box>

      <AddMeasurementDialog
        studyName={studyName}
        studyConfig={studyConfig}
        trialName={trialName}
        close={() => setTrialName(null)}
      />

      <CreateTrial
        studyName={studyName}
        studyConfig={studyConfig}
        open={openCustomTrial}
        onClose={() => setOpenCustomTrial(false)}
      />
    </>
  );
};
