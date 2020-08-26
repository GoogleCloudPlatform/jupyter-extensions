/* eslint-disable @typescript-eslint/camelcase */
import * as React from 'react';
import { Button, Select, MenuItem, withStyles } from '@material-ui/core';
import { Code } from '@material-ui/icons';

import {
  ModelDetailsService,
  ModelDetails,
} from './service/list_model_details';
import LoadingPanel from '../loading_panel';
import { DetailsPanel } from './details_panel';
import { Header } from '../shared/header';
import { QueryEditorTabWidget } from '../query_editor/query_editor_tab/query_editor_tab_widget';
import { WidgetManager } from '../../utils/widgetManager/widget_manager';
import { generateQueryId } from '../../reducers/queryEditorTabSlice';
import { localStyles } from './dataset_details_panel';
import { formatDate } from '../../utils/formatters';
import { getStarterQuery } from '../../utils/starter_queries';

interface Props {
  modelDetailsService: ModelDetailsService;
  isVisible: boolean;
  modelId: string;
  modelName: string;
}

interface State {
  hasLoaded: boolean;
  isLoading: boolean;
  panelIsLoading: boolean;
  details: ModelDetails;
  rows: DetailRow[];
  trainingRows: any[];
  currentRun: number;
  loadedRuns: any;
}

interface DetailRow {
  name: string;
  value: string | number;
}

const displayOptionNames = {
  actual_iterations: 'Actual iterations',
  data_split_column: 'Data split column',
  data_split_eval_fraction: 'Data split eval fraction',
  data_split_method: 'Data split method',
  distance_type: 'Distance type',
  early_stop: 'Early stop',
  initial_learn_rate: 'Initial learn rate',
  input_label_columns: 'Input label columns',
  kmeans_initialization_column: 'Kmeans initialization column',
  kmeans_initialization_method: 'Centroids initialization method',
  l1_regularization: 'L1 regularization',
  l2_regularization: 'L2 regularization',
  label_class_weights: 'Label class weights',
  learn_rate: 'Learn rate',
  learn_rate_strategy: 'Learn rate strategy',
  loss_type: 'Loss type',
  max_iterations: 'Max allowed iterations',
  min_relative_progress: 'Min relative progress',
  model_uri: 'Model uri',
  num_clusters: 'Number of clusters',
  optimization_strategy: 'Optimization strategy',
  warm_start: 'Warm start',
};

const StyledMenuItem = withStyles({
  selected: {
    color: '#1A73E8',
  },
})(MenuItem);

export default class ModelDetailsPanel extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasLoaded: false,
      isLoading: false,
      panelIsLoading: false,
      details: { details: {} } as ModelDetails,
      rows: [],
      currentRun: null,
      trainingRows: [],
      loadedRuns: {},
    };
  }

  async componentDidUpdate(prevProps: Props) {
    const isFirstLoad =
      !(this.state.hasLoaded || prevProps.isVisible) && this.props.isVisible;
    if (isFirstLoad) {
      await this.getDetails();
      this.getTrainingRunDetails(
        this.state.details.details.training_runs.length - 1
      );
    }
  }

  private async getDetails() {
    try {
      this.setState({ isLoading: true });
      const details = await this.props.modelDetailsService.listModelDetails(
        this.props.modelId
      );

      const detailsObj = details.details;
      const rows = [
        { name: 'Model ID', value: detailsObj.id },
        { name: 'Date created', value: formatDate(detailsObj.date_created) },
        {
          name: 'Model expiration',
          value: detailsObj.expires ? formatDate(detailsObj.expires) : 'Never',
        },
        {
          name: 'Date modified',
          value: formatDate(detailsObj.last_modified),
        },
        {
          name: 'Data location',
          value: detailsObj.location ? detailsObj.location : 'None',
        },
        {
          name: 'Model type',
          value: detailsObj.model_type,
        },
      ];
      this.setState({
        hasLoaded: true,
        details,
        rows,
        currentRun: detailsObj.training_runs.length - 1,
      });
    } catch (err) {
      console.warn('Error retrieving model details', err);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  private async getTrainingRunDetails(runIndex: number) {
    try {
      this.setState({ panelIsLoading: true });

      if (!this.state.loadedRuns[runIndex]) {
        const details = await this.props.modelDetailsService.getTrainingRunDetails(
          this.props.modelId,
          runIndex
        );

        const trainingRows = Object.entries(details.details).map(pair => {
          return { name: displayOptionNames[pair[0]], value: pair[1] };
        });

        const updatedRuns = { ...this.state.loadedRuns };
        updatedRuns[runIndex] = trainingRows;
        this.setState({ loadedRuns: updatedRuns });
      }
    } catch (err) {
      console.warn('Error retrieving model training run details', err);
    } finally {
      this.setState({ panelIsLoading: false });
    }
  }

  render() {
    if (this.state.isLoading) {
      return <LoadingPanel />;
    } else {
      return (
        <div className={localStyles.container}>
          <Header>
            <div>
              {this.props.modelName}
              {this.state.details.details.training_runs &&
              this.state.details.details.training_runs.length > 1 ? (
                <Select
                  value={this.state.currentRun}
                  onChange={event => {
                    this.setState({ currentRun: event.target.value as number });
                    this.getTrainingRunDetails(event.target.value as number);
                  }}
                  disableUnderline
                  style={{ marginLeft: '36px' }}
                >
                  {this.state.details.details.training_runs &&
                    this.state.details.details.training_runs.map(
                      (date, index) => {
                        return (
                          <StyledMenuItem
                            value={index}
                            key={`training_run_${index}`}
                          >
                            {index + 1} ({formatDate(date)})
                          </StyledMenuItem>
                        );
                      }
                    )}
                </Select>
              ) : (
                undefined
              )}
            </div>
            <Button
              onClick={() => {
                const queryId = generateQueryId();
                WidgetManager.getInstance().launchWidget(
                  QueryEditorTabWidget,
                  'main',
                  queryId,
                  undefined,
                  [queryId, getStarterQuery('MODEL', this.props.modelId)]
                );
              }}
              startIcon={<Code />}
              style={{ textTransform: 'none', color: '#1A73E8' }}
            >
              Query model
            </Button>
          </Header>

          <div className={localStyles.body}>
            {this.state.panelIsLoading ? (
              <LoadingPanel />
            ) : (
              <DetailsPanel
                details={this.state.details.details}
                rows={this.state.rows}
                trainingRows={this.state.loadedRuns[this.state.currentRun]}
                detailsType="MODEL"
              />
            )}
          </div>
        </div>
      );
    }
  }
}
