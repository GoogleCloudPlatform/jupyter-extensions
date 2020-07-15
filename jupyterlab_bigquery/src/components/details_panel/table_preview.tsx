import * as React from 'react';
import { stylesheet } from 'typestyle';

import {
  Table,
  TableBody,
  TableHead,
  TableCell,
  TableRow,
  TablePagination,
} from '@material-ui/core';

import LoadingPanel from '../loading_panel';
import {
  TableDetailsService,
  TablePreview,
} from './service/list_table_details';

const localStyles = stylesheet({
  tableHeader: {
    backgroundColor: '#f0f0f0',
    color: 'black',
  },
  tableCell: {
    border: 'var(--jp-border-width) solid var(--jp-border-color2)',
    whiteSpace: 'nowrap',
  },
  pagination: {
    backgroundColor: 'white',
    fontSize: '13px',
  },
  previewBody: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  scrollable: {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
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
  page: number;
  rowsPerPage: number;
  preview: TablePreview;
}

export default class TablePreviewPanel extends React.Component<Props, State> {
  private mounted = false;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasLoaded: false,
      isLoading: false,
      page: 0,
      rowsPerPage: 100,
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

  handleChangePage(event, newPage) {
    this.setState({ page: newPage });
  }

  handleChangeRowsPerPage(event) {
    this.setState({
      rowsPerPage: parseInt(event.target.value, 10),
    });
    this.setState({ page: 0 });
  }

  render() {
    const { rowsPerPage, page } = this.state;
    const rows = this.state.preview.rows;
    const fields = ['Row', ...this.state.preview.fields];
    if (this.state.isLoading) {
      return <LoadingPanel />;
    } else {
      return (
        <div className={localStyles.previewBody}>
          {rows.length > 0 ? (
            <div className={localStyles.previewBody}>
              <div className={localStyles.scrollable}>
                <Table
                  size="small"
                  style={{ width: 'auto', tableLayout: 'auto' }}
                >
                  <TableHead className={localStyles.tableHeader}>
                    <TableRow>
                      {fields.map((field, index) => (
                        <TableCell key={'field_' + index}>{field}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
                      .map((row, indexRow) => (
                        <TableRow key={'preview_row_' + indexRow}>
                          <TableCell>
                            {page * rowsPerPage + indexRow + 1}
                          </TableCell>
                          {row.map((cell, indexCell) => (
                            <TableCell
                              className={localStyles.tableCell}
                              key={
                                'preview_row_' + indexRow + '_cell' + indexCell
                              }
                            >
                              {cell}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
              <TablePagination
                className={localStyles.pagination}
                rowsPerPageOptions={[10, 30, 50, 100, 200]}
                component="div"
                count={rows.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onChangePage={this.handleChangePage.bind(this)}
                onChangeRowsPerPage={this.handleChangeRowsPerPage.bind(this)}
              />
            </div>
          ) : (
            <div>This table is empty.</div>
          )}
        </div>
      );
    }
  }
}
