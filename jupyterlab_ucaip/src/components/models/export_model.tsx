import { FormControl } from '@material-ui/core';
import { SelectInput, TextInput, DialogComponent } from 'gcp_jupyterlab_shared';
import * as React from 'react';
import { stylesheet } from 'typestyle';
import { CodeComponent } from '../copy_code';

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

export class ExportModel extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      name: '',
      framework: 'TF_CPU_2_1',
    };
  }

  render() {
    if (this.props.open) {
      return (
        <DialogComponent
          header={'Export custom model'}
          open={true}
          cancelLabel="OK"
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
          Export a pretrained model to uCAIP using the Python API
          <CodeComponent>
            {`from jupyterlab_ucaip import export_saved_model, ModelFramework

display_name= "${this.state.name}"
model_path = "my_model"
framework = ModelFramework.${this.state.framework}

# Save your model in preferred format to the local path
# model.save(model_path)

# Export local model to uCAIP
op = export_saved_model(display_name="${this.state.name}",
                        model_path=model_path,
                        framework=framework)

# Get result of export model operation
op.result()`}
          </CodeComponent>
        </DialogComponent>
      );
    }
    return null;
  }
}
