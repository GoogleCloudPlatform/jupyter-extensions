import * as React from 'react';
import {
  TableDetailsService,
  TableDetails,
} from './service/list_table_details';
import LoadingPanel from '../loading_panel';
import { DetailsPanel } from './details_panel';

interface Props {
  tableDetailsService: TableDetailsService;
  isVisible: boolean;
  tableId: string;
}

interface State {
  hasLoaded: boolean;
  isLoading: boolean;
  details: TableDetails;
  rows: DetailRow[];
}

interface DetailRow {
  name: string;
  value: string | number;
}

function formatBytes(numBytes, numDecimals = 2) {
  if (numBytes === 0) return '0 Bytes';
  //   const c = 0 > numDecimals ? 0 : numDecimals;
  const d = Math.floor(Math.log(numBytes) / Math.log(1024));
  return (
    parseFloat((numBytes / Math.pow(1024, d)).toFixed(numDecimals)) +
    ' ' +
    ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'][d]
  );
}

export default class TableDetailsPanel extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasLoaded: false,
      isLoading: false,
      details: { details: {} } as TableDetails,
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
      const details = await this.props.tableDetailsService.listTableDetails(
        this.props.tableId
      );

      const detailsObj = details.details;
      const rows = [
        { name: 'Table ID', value: detailsObj.id },
        {
          name: 'Table size',
          value: formatBytes(detailsObj.num_bytes),
        },
        {
          name: 'Number of rows',
          value: detailsObj.num_rows.toLocaleString(),
        },
        { name: 'Created', value: detailsObj.date_created },
        {
          name: 'Table expiration',
          value: detailsObj.expiration ? detailsObj.expiration : 'Never',
        },
        {
          name: 'Last modified',
          value: detailsObj.last_modified,
        },
        {
          name: 'Data location',
          value: detailsObj.location ? detailsObj.location : 'None',
        },
      ];

      this.setState({ hasLoaded: true, details, rows });
    } catch (err) {
      console.warn('Error retrieving table details', err);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  render() {
    if (this.state.isLoading) {
      return <LoadingPanel />;
    } else {
      return (
        <DetailsPanel
          details={this.state.details.details}
          rows={this.state.rows}
          detailsType="table"
        />
      );
    }
  }
}
