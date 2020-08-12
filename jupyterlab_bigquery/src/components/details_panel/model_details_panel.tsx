import * as React from 'react';
import { Button } from '@material-ui/core';
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

interface Props {
  modelDetailsService: ModelDetailsService;
  isVisible: boolean;
  modelId: string;
  modelName: string;
}

interface State {
  hasLoaded: boolean;
  isLoading: boolean;
  details: ModelDetails;
  rows: DetailRow[];
}

interface DetailRow {
  name: string;
  value: string | number;
}

export default class ModelDetailsPanel extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasLoaded: false,
      isLoading: false,
      details: { details: {} } as ModelDetails,
      rows: [],
    };
  }

  componentDidUpdate(prevProps: Props) {
    const isFirstLoad =
      !(this.state.hasLoaded || prevProps.isVisible) && this.props.isVisible;
    if (isFirstLoad) {
      this.getDetails();
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
      this.setState({ hasLoaded: true, details, rows });
    } catch (err) {
      console.warn('Error retrieving model details', err);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  render() {
    if (this.state.isLoading) {
      return <LoadingPanel />;
    } else {
      return (
        <div className={localStyles.container}>
          <Header
            text={this.props.modelName}
            buttons={[
              <Button
                onClick={() => {
                  const queryId = generateQueryId();
                  WidgetManager.getInstance().launchWidget(
                    QueryEditorTabWidget,
                    'main',
                    queryId,
                    undefined,
                    [
                      queryId,
                      `SELECT * FROM ML.PREDICT(MODEL \`${this.props.modelId}\`, )`,
                    ]
                  );
                }}
                startIcon={<Code />}
                style={{ textTransform: 'none', color: '#1A73E8' }}
              >
                Query model
              </Button>,
            ]}
          />
          <div className={localStyles.body}>
            <DetailsPanel
              details={this.state.details.details}
              rows={this.state.rows}
              detailsType="MODEL"
            />
          </div>
        </div>
      );
    }
  }
}
