import React, { Component } from 'react';
import { stylesheet } from 'typestyle';
import { connect } from 'react-redux';
import { QueryResult, QUERY_DATA_TYPE } from './query_text_editor';
import { QueryId } from '../../../reducers/queryEditorTabSlice';
import { Header } from '../../shared/header';
import { BQTable } from '../../shared/bq_table';
import { Button } from '@material-ui/core';
import { Equalizer } from '@material-ui/icons';
import QueryResultsManager from '../../../utils/QueryResultsManager';

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

export type QueryEditorType = 'FULL_WINDOW' | 'IN_CELL';

interface QueryResultsProps {
  queryResult: QueryResult;
  queryId: QueryId;
  editorType?: QueryEditorType;
}

class QueryResults extends Component<QueryResultsProps, QueryResultsState> {
  queryId: QueryId;
  queryManager: QueryResultsManager;

  constructor(props) {
    super(props);
    this.state = {
      page: 0,
      rowsPerPage: 10,
    };
    this.queryId = props.queryId;
    this.queryManager = new QueryResultsManager(QUERY_DATA_TYPE);
  }

  handleDatastudioExploreButton() {
    const { query, project } = this.props.queryResult;
    const config = {
      sql: query.replace(' ', '+'),
      billingProjectId: project,
      projectId: project,
      connectorType: 'BIG_QUERY',
      sqlType: 'STANDARD_SQL',
    };
    const url =
      'https://datastudio.google.com/c/u/0/linking/setupAnalysis?config=' +
      JSON.stringify(config);
    window.open(url);
  }

  render() {
    const fields = this.props.queryResult.labels;
    const rows = this.queryManager.getSlot(this.queryId);

    return (
      <div
        className={
          this.props.editorType === 'IN_CELL'
            ? localStyles.inCell
            : localStyles.resultsContainer
        }
      >
        <Header>
          Query results
          <Button
            startIcon={<Equalizer fontSize="small" />}
            onClick={this.handleDatastudioExploreButton.bind(this)}
            style={{ textTransform: 'none', color: '#1A73E8' }}
          >
            Explore with Data Studio
          </Button>
        </Header>
        {fields.length > 0 && (
          <BQTable fields={fields} rows={rows as (string | number)[][]} />
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const queryId = ownProps.queryId;
  let queryResult = state.queryEditorTab.queries[queryId];

  if (!queryResult) {
    queryResult = {
      contentLen: 0,
      labels: [],
      bytesProcessed: null,
      queryId: queryId,
    } as QueryResult;
  }
  return { queryResult: queryResult };
};

export default connect(mapStateToProps)(QueryResults);
