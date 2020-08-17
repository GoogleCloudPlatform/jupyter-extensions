// @ts-nocheck
import React, { Component } from 'react';
import { stylesheet } from 'typestyle';
import { connect } from 'react-redux';
import { QueryResult } from './query_text_editor';
import { QueryId } from '../../../reducers/queryEditorTabSlice';
import { Header } from '../../shared/header';
import { BQTable } from '../../shared/bq_table';
import { Button, Typography } from '@material-ui/core';
import { Equalizer } from '@material-ui/icons';

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

  constructor(props) {
    super(props);
    this.state = {
      page: 0,
      rowsPerPage: 10,
    };
    this.queryId = props.queryId;
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
    const rows = this.props.queryResult.content;

    return (
      <div
        className={
          this.props.editorType === 'IN_CELL'
            ? localStyles.inCell
            : localStyles.resultsContainer
        }
      >
        <Header
          text="Query results"
          buttons={[
            <Button
              startIcon={<Equalizer fontSize="small" />}
              onClick={this.handleDatastudioExploreButton.bind(this)}
              style={{ textTransform: 'none', color: '#1A73E8' }}
            >
              Explore with Data Studio
            </Button>,
          ]}
        />
        {fields.length > 0 && <BQTable fields={fields} rows={rows} />}
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
