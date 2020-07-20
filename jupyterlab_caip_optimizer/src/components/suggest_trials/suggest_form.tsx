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
import { Box, Button, TextField } from '@material-ui/core';
import { useErrorState } from '../../utils/use_error_state';
import { useDispatch } from 'react-redux';
import { requestAndGetSuggestedTrial } from '../../store/studies';

interface Props {
  studyName: string;
  isActiveTrial: boolean;
}

export const SuggestForm: React.FC<Props> = ({ isActiveTrial, studyName }) => {
  const dispatch = useDispatch();
  const [numberOfSuggestions, setNumberOfSuggestions] = useErrorState<string>(
    '1',
    numberString => {
      const number = parseInt(numberString, 10);

      if (number < 0) {
        return 'Can not be negative.';
      } else if (number === 0) {
        return 'Can not be zero.';
      }
    }
  );

  const handleSubmit = async event => {
    event.preventDefault();

    const { value: numberString, error } = numberOfSuggestions;

    if (!error) {
      await dispatch(
        requestAndGetSuggestedTrial({
          studyName,
          suggestionCount: parseInt(numberString, 10),
        })
      );
    }
  };

  return (
    <Box display="flex" clone>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Number of Trial Suggestions"
          type="number"
          required
          variant="outlined"
          value={numberOfSuggestions.value}
          onChange={event => setNumberOfSuggestions(event.target.value)}
          error={numberOfSuggestions.error}
          helperText={
            isActiveTrial
              ? 'Complete active trial.'
              : numberOfSuggestions.helperText
          }
          disabled={isActiveTrial}
          inputProps={{
            'data-testid': 'suggestionInput',
          }}
        />
        <Box style={{ display: 'inline-block' }} ml={2} my="auto">
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={isActiveTrial}
          >
            Get Suggestions
          </Button>
        </Box>
      </form>
    </Box>
  );
};
