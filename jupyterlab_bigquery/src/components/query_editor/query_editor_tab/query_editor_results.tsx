// @ts-nocheck
import React, { Component } from 'react';
import { stylesheet } from 'typestyle';
import { connect } from 'react-redux';
import { QueryResult } from '../query_text_editor/query_text_editor';
import { QueryId } from '../../../reducers/queryEditorTabSlice';
import { Header } from '../../shared/header';
import { BQTable } from '../../shared/bq_table';

const localStyles = stylesheet({
  resultsContainer: {
    // 5/9 of panel height (in relation to editor)
    flex: 5,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  inCell: {
    height: '350px',
    display: 'flex',
    flexDirection: 'column',
  },
});

interface QueryResultsState {
  page: number;
  rowsPerPage: number;
}

interface QueryResultsProps {
  queryResult: QueryResult;
  queryId: QueryId;
  location?: string;
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

  render() {
    const fields = this.props.queryResult.labels;
    const rows = this.props.queryResult.content;

    return (
      <div className={localStyles.resultsContainer}>
        <Header text="Query results" />
        {fields.length > 0 ? <BQTable fields={fields} rows={rows} /> : <></>}
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
