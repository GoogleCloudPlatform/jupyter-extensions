import * as React from 'react';

import { ViewDetailsService, ViewDetails } from './service/list_view_details';
import { Header } from '../shared/header';
import LoadingPanel from '../loading_panel';
import { DetailsPanel } from './details_panel';
import { localStyles } from './dataset_details_panel';

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

  formatMs(ms) {
    const days = ms / 86400000;
    return `${days} day${days > 1 ? 's' : ''} 0 hr`;
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
        { name: 'Created', value: detailsObj.date_created },
        { name: 'Last modified', value: detailsObj.last_modified },
        { name: 'View expiration', value: detailsObj.expires ?? 'Never' },
        { name: 'Use Legacy SQL', value: detailsObj.legacy_sql },
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
          <Header text={this.props.view_name} />
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
