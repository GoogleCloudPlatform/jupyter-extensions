// @ts-nocheck
import React, { Component } from 'react';
import { stylesheet } from 'typestyle';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  IconButton,
} from '@material-ui/core';
import {
  KeyboardArrowLeft,
  KeyboardArrowRight,
  FirstPage,
  LastPage,
} from '@material-ui/icons';
import { connect } from 'react-redux';
import { QueryResult } from '../query_text_editor/query_text_editor';
import { QueryId } from '../../../reducers/queryEditorTabSlice';

const localStyles = stylesheet({
  header: {
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
    fontSize: '18px',
    margin: 0,
    padding: '8px 12px 8px 24px',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    color: 'black',
  },
  tableCell: {
    border: 'var(--jp-border-width) solid var(--jp-border-color2)',
  },
  pagination: {
    position: 'fixed',
    bottom: 30,
    backgroundColor: 'white',
    fontSize: '13px',
  },
  paginationOptions: {
    display: 'flex',
    fontSize: '13px',
  },
  resultsContainer: {
    overflow: 'auto',
    width: '100%',
    height: '-webkit-calc(50% - 50px)',
  },
});

interface QueryResultsState {
  page: number;
  rowsPerPage: number;
}

interface QueryResultsProps {
  queryResult: QueryResult;
  queryId: QueryId;
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

class QueryResults extends Component<QueryResultsProps, QueryResultsState> {
  queryId: QueryId;

  constructor(props) {
    super(props);
    this.state = {
      page: 0,
      rowsPerPage: 10,
    };
    this.queryId = props.queryId;
  }

  handleChangePage(event, newPage) {
    this.setState({ page: newPage });
  }

  handleChangeRowsPerPage(event) {
    this.setState({ rowsPerPage: parseInt(event.target.value, 10) });
    this.setState({ page: 0 });
  }

  render() {
    const fields = ['Row', ...this.props.queryResult.labels];
    const rows = this.props.queryResult.content;

    const { rowsPerPage, page } = this.state;

    return (
      <div className={localStyles.resultsContainer}>
        <div className={localStyles.header}>Query results</div>
        <Table size="small" style={{ width: 'auto', tableLayout: 'auto' }}>
          <TableHead className={localStyles.tableHeader}>
            <TableRow>
              {this.props.queryResult.labels.length !== 0 &&
                fields.map((field, index) => (
                  <TableCell key={`result_field_${index}`}>{field}</TableCell>
                ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, rowIndex) => (
                <TableRow key={'result_row' + rowIndex}>
                  <TableCell>{page * rowsPerPage + rowIndex + 1}</TableCell>
                  {row.map((cell, cellIndex) => (
                    <TableCell
                      className={localStyles.tableCell}
                      key={'result_row_' + rowIndex + '_cell' + cellIndex}
                    >
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
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
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const queryId = ownProps.queryId;
  let queryResult = state.queryEditorTab.queries[queryId];

  if (!queryResult) {
    queryResult = {
      content: [],
      labels: [],
      bytesProcessed: null,
      queryId: queryId,
    } as QueryResult;
  }
  return { queryResult: queryResult };
};

export default connect(mapStateToProps)(QueryResults);
