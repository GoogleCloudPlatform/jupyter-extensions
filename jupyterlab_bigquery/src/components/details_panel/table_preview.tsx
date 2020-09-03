import * as React from 'react';
import { stylesheet } from 'typestyle';
import { Warning } from '@material-ui/icons';

import LoadingPanel from '../loading_panel';
import {
  TableDetailsService,
  TablePreview,
} from './service/list_table_details';
import { BQTable } from '../shared/bq_table';
import InfoCard from '../shared/info_card';
import { gColor } from '../shared/styles';

const localStyles = stylesheet({
  previewBody: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    paddingTop: '12px',
  },
});

interface Props {
  tableDetailsService: TableDetailsService;
  tableId: string;
  isVisible: boolean;
}

interface State {
  hasLoaded: boolean;
  isLoading: boolean;
  preview: TablePreview;
}

export default class TablePreviewPanel extends React.Component<Props, State> {
  private mounted = false;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasLoaded: false,
      isLoading: false,
      preview: { fields: [], rows: [] },
    };
  }

  async componentDidMount() {
    this.mounted = true;
    try {
      this.getPreview();
    } catch (err) {
      console.warn('Unexpected error', err);
    }
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  private async getPreview() {
    try {
      if (this.mounted) {
        this.setState({ isLoading: true });
      }
      const preview = await this.props.tableDetailsService.getTablePreview(
        this.props.tableId
      );
      if (this.mounted) {
        this.setState({ hasLoaded: true, preview });
      }
    } catch (err) {
      console.warn('Error retrieving table preview', err);
    } finally {
      if (this.mounted) {
        this.setState({ isLoading: false });
      }
    }
  }

  render() {
    const { rows, fields } = this.state.preview;
    if (this.state.isLoading) {
      return <LoadingPanel />;
    } else {
      return (
        <div className={localStyles.previewBody}>
          {rows.length > 0 ? (
            <div className={localStyles.previewBody}>
              <div>(First 100 rows)</div>
              <br />
              <BQTable rows={rows} fields={fields} />
            </div>
          ) : (
            <div className={localStyles.previewBody}>
              <InfoCard
                color={gColor('YELLOW')}
                message="This table is empty."
                icon={<Warning />}
              />
            </div>
          )}
        </div>
      );
    }
  }
}
