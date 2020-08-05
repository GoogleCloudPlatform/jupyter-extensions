import * as React from 'react';

import {
  DatasetDetailsService,
  DatasetDetails,
} from './service/list_dataset_details';
import { Header } from '../shared/header';
import LoadingPanel from '../loading_panel';
import { DetailsPanel } from './details_panel';
import { stylesheet } from 'typestyle';

const localStyles = stylesheet({
  body: {
    marginBottom: '24px',
    marginRight: '24px',
    marginLeft: '24px',
    height: '100%',
    overflowY: 'auto',
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

  formatMs(ms) {
    const days = ms / 86400000;
    return `${days} day${days > 1 ? 's' : ''} 0 hr`;
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
        { name: 'Created', value: detailsObj.date_created },
        {
          name: 'Default table expiration',
          value: detailsObj.default_expiration
            ? this.formatMs(detailsObj.default_expiration)
            : 'Never',
        },
        { name: 'Last modified', value: detailsObj.last_modified },
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
        <div style={{ height: '100%' }}>
          <Header text={this.props.dataset_id} />
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
