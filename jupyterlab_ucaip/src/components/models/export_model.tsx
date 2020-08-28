import { FormControl, Dialog } from '@material-ui/core';
import {
  SelectInput,
  TextInput,
  ActionBar,
  SubmitButton,
  BASE_FONT,
  COLORS,
} from 'gcp_jupyterlab_shared';
import * as React from 'react';
import * as csstips from 'csstips';
import { stylesheet } from 'typestyle';
import { AppContext } from '../../context';
import { CodeGenService } from '../../service/code_gen';
import { CodeComponent } from '../copy_code';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface State {
  path: string;
  name: string;
  framework: string;
}

const dialogStyle = stylesheet({
  header: {
    ...BASE_FONT,
    fontWeight: 500,
    fontSize: '15px',
    margin: '16px 16px 0 16px',
    ...csstips.horizontal,
    ...csstips.center,
  },
  main: {
    backgroundColor: COLORS.white,
    color: COLORS.base,
    padding: '16px',
    ...BASE_FONT,
    ...csstips.vertical,
  },
});

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
  static contextType = AppContext;
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
        <Dialog open={true} fullWidth={true} maxWidth={'sm'}>
          <header className={dialogStyle.header}>Export custom model</header>
          <main className={dialogStyle.main}>
            <div style={{ width: 300 }}>
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
            </div>
            Export a pretrained model to uCAIP using the Python API
            <CodeComponent generateEnabled={false}>
              {this.getExportCode()}
            </CodeComponent>
          </main>
          <ActionBar onClick={this.props.onClose} closeLabel={'OK'}>
            <SubmitButton
              actionPending={
                !this.context.notebookTracker.currentWidget ||
                !this.state.path ||
                !this.state.name
              }
              onClick={() => {
                CodeGenService.generateCodeCell(
                  this.context,
                  this.getExportCode(),
                  null
                );
                this.props.onClose();
              }}
              text={'Generate code cell'}
            />
          </ActionBar>
        </Dialog>
      );
    }
    return null;
  }
}

ExportModel.contextType = AppContext;
