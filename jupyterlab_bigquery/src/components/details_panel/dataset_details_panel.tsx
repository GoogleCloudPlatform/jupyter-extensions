import * as React from 'react';

import {
  DatasetDetailsService,
  DatasetDetails,
} from './service/list_dataset_details';
import { Header } from '../shared/header';
import LoadingPanel from '../loading_panel';
import { DetailsPanel } from './details_panel';
import { stylesheet } from 'typestyle';
import { formatDate, formatMs } from '../../utils/formatters';
import { BASE_FONT } from 'gcp_jupyterlab_shared';

export const localStyles = stylesheet({
  body: {
    marginRight: '24px',
    marginLeft: '24px',
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    ...BASE_FONT,
  },
});

interface Props {
  datasetDetailsService: DatasetDetailsService;
  isVisible: boolean;
  dataset_id: string;
}

interface State {
  hasLoaded: boolean;
  isLoading: boolean;
  details: DatasetDetails;
  rows: DetailRow[];
}

interface DetailRow {
  name: string;
  value: string;
}

export default class DatasetDetailsPanel extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasLoaded: false,
      isLoading: false,
      details: { details: {} } as DatasetDetails,
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
      const details = await this.props.datasetDetailsService.listDatasetDetails(
        this.props.dataset_id
      );

      const detailsObj = details.details;
      const rows = [
        { name: 'Dataset ID', value: detailsObj.id },
        { name: 'Created', value: formatDate(detailsObj.date_created) },
        {
          name: 'Default table expiration',
          value: detailsObj.default_expiration
            ? formatMs(detailsObj.default_expiration)
            : 'Never',
        },
        {
          name: 'Last modified',
          value: formatDate(detailsObj.last_modified),
        },
        {
          name: 'Data location',
          value: detailsObj.location ? detailsObj.location : 'None',
        },
      ];

      this.setState({ hasLoaded: true, details, rows });
    } catch (err) {
      console.warn('Error retrieving dataset details', err);
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
          <Header>{this.props.dataset_id}</Header>
          <div className={localStyles.body}>
            <DetailsPanel
              details={this.state.details.details}
              rows={this.state.rows}
              detailsType="DATASET"
            />
          </div>
        </div>
      );
    }
  }
}
