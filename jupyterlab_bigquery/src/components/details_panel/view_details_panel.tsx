import * as React from 'react';
import { Button } from '@material-ui/core';
import { Code } from '@material-ui/icons';

import { ViewDetailsService, ViewDetails } from './service/list_view_details';
import { Header } from '../shared/header';
import LoadingPanel from '../loading_panel';
import { DetailsPanel } from './details_panel';
import { QueryEditorTabWidget } from '../query_editor/query_editor_tab/query_editor_tab_widget';
import { WidgetManager } from '../../utils/widgetManager/widget_manager';
import { generateQueryId } from '../../reducers/queryEditorTabSlice';
import { localStyles } from './dataset_details_panel';
import { formatDate } from '../../utils/formatters';

interface Props {
  viewDetailsService: ViewDetailsService;
  isVisible: boolean;
  view_id: string;
  view_name: string;
}

interface State {
  hasLoaded: boolean;
  isLoading: boolean;
  details: ViewDetails;
  rows: DetailRow[];
}

interface DetailRow {
  name: string;
  value: string;
}

export default class ViewDetailsPanel extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasLoaded: false,
      isLoading: false,
      details: { details: {} } as ViewDetails,
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
      const details = await this.props.viewDetailsService.listViewDetails(
        this.props.view_id
      );

      const detailsObj = details.details;
      const rows = [
        { name: 'View ID', value: detailsObj.id },
        { name: 'Created', value: formatDate(detailsObj.date_created) },
        { name: 'Last modified', value: formatDate(detailsObj.last_modified) },
        {
          name: 'View expiration',
          value: detailsObj.expires ? formatDate(detailsObj.expires) : 'Never',
        },
        {
          name: 'Use Legacy SQL',
          value: detailsObj.legacy_sql ? 'true' : 'false',
        },
      ];

      this.setState({ hasLoaded: true, details, rows });
    } catch (err) {
      console.warn('Error retrieving view details', err);
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
          <Header>
            {this.props.view_name}
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
                    `SELECT * FROM \`${this.props.view_id}\` LIMIT 1000`,
                  ]
                );
              }}
              startIcon={<Code />}
              style={{ textTransform: 'none', color: '#1A73E8' }}
            >
              Query view
            </Button>
          </Header>
          <div className={localStyles.body}>
            <DetailsPanel
              details={this.state.details.details}
              rows={this.state.rows}
              detailsType="VIEW"
            />
          </div>
        </div>
      );
    }
  }
}
