import * as React from 'react';
import {
  TableDetailsService,
  TableDetails,
} from './service/list_table_details';
import LoadingPanel from '../loading_panel';
import { DetailsPanel } from './details_panel';
import { formatDate } from '../../utils/formatters';

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
  const d = Math.floor(Math.log(numBytes) / Math.log(1024));
  return (
    parseFloat((numBytes / Math.pow(1024, d)).toFixed(numDecimals)) +
    ' ' +
    ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'][d]
  );
}

export default class TableDetailsPanel extends React.Component<Props, State> {
  private mounted = false;
  constructor(props: Props) {
    super(props);
    this.state = {
      hasLoaded: false,
      isLoading: false,
      details: { details: {} } as TableDetails,
      rows: [],
    };
  }

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
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
      if (this.mounted) {
        this.setState({ isLoading: true });
      }

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
        { name: 'Created', value: formatDate(detailsObj.date_created) },
        {
          name: 'Table expiration',
          value: detailsObj.expires ? formatDate(detailsObj.expires) : 'Never',
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
      if (this.mounted) {
        this.setState({ hasLoaded: true, details, rows });
      }
    } catch (err) {
      console.warn('Error retrieving table details', err);
    } finally {
      if (this.mounted) {
        this.setState({ isLoading: false });
      }
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
          detailsType="TABLE"
        />
      );
    }
  }
}
