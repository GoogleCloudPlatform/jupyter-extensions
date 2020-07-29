import * as React from 'react';
import { stylesheet } from 'typestyle';

import {
  Table,
  TableBody,
  TableHead,
  TableCell,
  TableRow,
  TablePagination,
  IconButton,
} from '@material-ui/core';
import {
  KeyboardArrowLeft,
  KeyboardArrowRight,
  FirstPage,
  LastPage,
} from '@material-ui/icons';

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
  paginationOptions: {
    display: 'flex',
    fontSize: '13px',
  },
  scrollable: {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
  },
});

interface Props {
  rows: (string | number)[][];
  fields: string[];
}

interface State {
  page: number;
  rowsPerPage: number;
}

interface TablePaginationActionsProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onChangePage: (
    event: React.MouseEvent<HTMLButtonElement>,
    newPage: number
  ) => void;
}

function TablePaginationActions(props: TablePaginationActionsProps) {
  const { count, page, rowsPerPage, onChangePage } = props;

  const handleFirstPageButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    onChangePage(event, 0);
  };

  const handleBackButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    onChangePage(event, page - 1);
  };

  const handleNextButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    onChangePage(event, page + 1);
  };

  const handleLastPageButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    onChangePage(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <div className={localStyles.paginationOptions}>
      <IconButton onClick={handleFirstPageButtonClick} disabled={page === 0}>
        <FirstPage />
      </IconButton>
      <IconButton onClick={handleBackButtonClick} disabled={page === 0}>
        <KeyboardArrowLeft />
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
      >
        <KeyboardArrowRight />
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
      >
        <LastPage />
      </IconButton>
    </div>
  );
}

export class BQTable extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      page: 0,
      rowsPerPage: 100,
    };
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
    const rows = this.props.rows;
    const fields = ['Row', ...this.props.fields];

    return (
      <>
        <div className={localStyles.scrollable}>
          <Table size="small" style={{ width: 'auto', tableLayout: 'auto' }}>
            <TableHead className={localStyles.tableHeader}>
              <TableRow>
                {fields.map((field, index) => (
                  <TableCell key={'field_' + index}>{field}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, indexRow) => (
                  <TableRow key={'table_row_' + indexRow}>
                    <TableCell>{page * rowsPerPage + indexRow + 1}</TableCell>
                    {row.map((cell, indexCell) => (
                      <TableCell
                        className={localStyles.tableCell}
                        key={'table_row_' + indexRow + '_cell' + indexCell}
                      >
                        {cell}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
        {/* TODO(cxjia): hide table pagination when result rows <= 10 */}
        <TablePagination
          className={localStyles.pagination}
          rowsPerPageOptions={[10, 30, 50, 100, 200]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onChangePage={this.handleChangePage.bind(this)}
          onChangeRowsPerPage={this.handleChangeRowsPerPage.bind(this)}
          ActionsComponent={TablePaginationActions}
        />
      </>
    );
  }
}
