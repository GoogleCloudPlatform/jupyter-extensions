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
  withStyles,
} from '@material-ui/core';
import {
  KeyboardArrowLeft,
  KeyboardArrowRight,
  FirstPage,
  LastPage,
} from '@material-ui/icons';

import { TableHeadCell, StyledTableRow } from './schema_table';
import { BASE_FONT } from 'gcp_jupyterlab_shared';

const localStyles = stylesheet({
  paginationOptions: {
    display: 'flex',
    fontSize: '13px',
  },
  scrollable: {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
  },
  null: {
    fontStyle: 'italic',
    color: 'gray',
  },
});

const StyledIconButton = withStyles({
  root: {
    color: 'var(--jp-ui-font-color1)',
    '&.Mui-disabled': {
      color: 'var(--jp-ui-font-color3)',
    },
  },
})(IconButton);

const StyledTableCell = withStyles({
  root: {
    color: 'var(--jp-ui-font-color1)',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    maxWidth: '500px',
    fontSize: '13px',
    BASE_FONT,
    border: 0,
  },
})(TableCell);

export const StyledPagination: React.ComponentType<any> = withStyles({
  root: {
    backgroundColor: 'var(--jp-layout-color0)',
    color: 'var(--jp-ui-font-color1)',
    fontSize: '13px',
    borderTop: 'var(--jp-border-width) solid var(--jp-border-color2)',
  },
  selectIcon: {
    color: 'var(--jp-ui-font-color1)',
  },
  menuItem: {
    color: 'var(--jp-ui-font-color1)',
    backgroundColor: 'var(--jp-layout-color0)',
    '&.Mui-selected': {
      backgroundColor: 'var(--jp-layout-color2)',
      '&:hover': {
        backgroundColor: 'var(--jp-layout-color2)',
      },
    },
    '&:hover': {
      backgroundColor: 'var(--jp-layout-color2)',
    },
  },
})(TablePagination);

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

export function TablePaginationActions(props: TablePaginationActionsProps) {
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
      <StyledIconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        size="small"
      >
        <FirstPage />
      </StyledIconButton>
      <StyledIconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        size="small"
      >
        <KeyboardArrowLeft />
      </StyledIconButton>
      <StyledIconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        size="small"
      >
        <KeyboardArrowRight />
      </StyledIconButton>
      <StyledIconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        size="small"
      >
        <LastPage />
      </StyledIconButton>
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
          <Table
            size="small"
            style={{
              width: 'auto',
              tableLayout: 'auto',
            }}
          >
            <TableHead>
              <TableRow>
                {fields.map((field, index) => (
                  <TableHeadCell key={'field_' + index}>{field}</TableHeadCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, indexRow) => (
                  <StyledTableRow key={'table_row_' + indexRow}>
                    <StyledTableCell>
                      {page * rowsPerPage + indexRow + 1}
                    </StyledTableCell>
                    {row.map((cell, indexCell) => (
                      <StyledTableCell
                        key={'table_row_' + indexRow + '_cell' + indexCell}
                      >
                        {cell ?? <div className={localStyles.null}>null</div>}
                      </StyledTableCell>
                    ))}
                  </StyledTableRow>
                ))}
            </TableBody>
          </Table>
        </div>
        {/* TODO(cxjia): hide table pagination when result rows <= 10 */}
        <StyledPagination
          rowsPerPageOptions={[10, 30, 50, 100, 200]}
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onChangePage={this.handleChangePage.bind(this)}
          onChangeRowsPerPage={this.handleChangeRowsPerPage.bind(this)}
          ActionsComponent={TablePaginationActions}
          component="div"
        />
      </>
    );
  }
}
