/* eslint-disable @typescript-eslint/camelcase*/
import { shallow } from 'enzyme';
import * as React from 'react';

import ModelDetailsPanel, { StyledSelect } from './model_details_panel';
import { ModelDetailsService } from './service/list_model_details';
jest.mock('./service/list_model_details');

describe('ModelDetailsPanel', () => {
  it('Does not render training run dropdown when there is only one run.', () => {
    const mockService = new ModelDetailsService();

    const modelDetailsPanel = shallow(
      <ModelDetailsPanel
        modelDetailsService={mockService}
        isVisible={true}
        modelId="someModelId"
        modelName="modelName"
      />
    );
    modelDetailsPanel.setState({
      details: { details: { training_runs: ['9/9/20'] } },
    });
    expect(modelDetailsPanel.find(StyledSelect).exists()).toBeFalsy();
  });

  it('Renders training run dropdown for multiple runs.', () => {
    const mockService = new ModelDetailsService();
    const modelDetailsPanel = shallow(
      <ModelDetailsPanel
        modelDetailsService={mockService}
        isVisible={true}
        modelId="someModelId"
        modelName="modelName"
      />
    );
    modelDetailsPanel.setState({
      details: { details: { training_runs: ['9/9/20', '9/10/20'] } },
    });
    expect(modelDetailsPanel.find(StyledSelect).exists()).toBeTruthy();
  });

  it.todo(
    'Renders the training run details for the run in the last (most recent) index if there are multiple runs.'
  );
});
