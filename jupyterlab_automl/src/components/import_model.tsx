import { FormControl } from '@material-ui/core';
import { DialogComponent, SelectInput, TextInput } from 'gcp_jupyterlab_shared';
import * as React from 'react';
import { stylesheet } from 'typestyle';
import { CodeComponent } from './copy_code';
import { CodeGenService } from '../service/code_gen';
import { Context } from './automl_widget';

interface Props {
  context: Context;
  open: boolean;
  onClose: () => void;
}

interface State {
  path: string;
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
      path: '',
      name: '',
      framework: 'TF_CPU_2_1',
    };
  }

  private getExportCode() {
    return CodeGenService.exportModelCode(
      this.state.path,
      this.state.name,
      this.state.framework
    );
  }

  render() {
    if (this.props.open) {
      return (
        <DialogComponent
          header={'Import custom model'}
          open={true}
          cancelLabel="OK"
          onClose={this.props.onClose}
          onCancel={this.props.onClose}
          submitLabel="Generate code cell"
          onSubmit={() => {
            CodeGenService.generateCodeCell(
              this.props.context,
              this.getExportCode(),
              null
            );
            this.props.onClose();
          }}
          submitDisabled={
            !this.props.context.notebookTracker.currentWidget ||
            !this.state.path ||
            !this.state.name
          }
        >
          <FormControl className={localStyles.form}>
            <TextInput
              placeholder="path/to/model"
              label="Path to saved model"
              onChange={event => {
                this.setState({ path: event.target.value });
              }}
            />
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
          Import a pretrained model to uCAIP using the Python API
          <CodeComponent>{this.getExportCode()}</CodeComponent>
        </DialogComponent>
      );
    }
    return null;
  }
}
