import { FormControl } from '@material-ui/core';
import { DialogComponent, SelectInput, TextInput } from 'gcp_jupyterlab_shared';
import * as React from 'react';
import { stylesheet } from 'typestyle';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface State {
  name: string;
  framework: string;
}

const localStyles = stylesheet({
  input: {
    display: 'none',
  },
  form: {
    width: '100%',
  },
  fileInput: {
    paddingBottom: 8,
  },
});

export class ImportModel extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      name: '',
      framework: '',
    };
  }

  render() {
    return (
      <>
        {this.props.open && (
          <DialogComponent
            header={'Import model'}
            open={true}
            onClose={this.props.onClose}
            onCancel={this.props.onClose}
            hideSubmit
          >
            <FormControl className={localStyles.form}>
              <TextInput
                placeholder="my_model"
                label="Name"
                onChange={event => {
                  this.setState({ name: event.target.value });
                }}
              />
              <SelectInput
                label={'Model framework'}
                options={[
                  {
                    text: 'TensorFlow 2.1 (CPU)',
                    value: 'TF_CPU_2_1',
                  },
                  {
                    text: 'TensorFlow 2.1 (GPU)',
                    value: 'TF_GPU_2_1',
                  },
                  {
                    text: 'TensorFlow 1.15 (CPU)',
                    value: 'TF_CPU_1_15',
                  },
                  {
                    text: 'TensorFlow 1.15 (GPU)',
                    value: 'TF_GPU_1_15',
                  },
                  {
                    text: 'scikit-learn 0.20 (CPU)',
                    value: 'SKLEARN_CPU_0_20',
                  },
                  {
                    text: 'scikit-learn 0.22 (CPU)',
                    value: 'SKLEARN_CPU_0_22',
                  },
                  {
                    text: 'XGBoost 0.82 (CPU)',
                    value: 'XGBOOST_CPU_0_82',
                  },
                  {
                    text: 'XGBoost 0.90 (CPU)',
                    value: 'XGBOOST_CPU_0_90',
                  },
                ]}
                onChange={event => {
                  this.setState({ framework: event.target.value });
                }}
              />
            </FormControl>
          </DialogComponent>
        )}
      </>
    );
  }
}
