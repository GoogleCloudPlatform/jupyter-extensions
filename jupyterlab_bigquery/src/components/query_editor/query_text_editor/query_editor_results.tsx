// @ts-nocheck
import React, { Component } from 'react';
import { stylesheet } from 'typestyle';
import { connect } from 'react-redux';
import { QueryResult } from './query_text_editor';
import { QueryId } from '../../../reducers/queryEditorTabSlice';
import { Header } from '../../shared/header';
import { BQTable } from '../../shared/bq_table';
import { Button, Typography } from '@material-ui/core';
import { ContextMenu } from 'gcp_jupyterlab_shared';
import DropDown from '../../shared/dropdown';
import { Equalizer, ArrowDropDown } from '@material-ui/icons';

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

  render() {
    const fields = this.props.queryResult.labels;
    const rows = this.props.queryResult.content;

    console.log(this.props.queryResult.project);
    console.log(this.props.queryResult.query);
    console.log(this.props.queryResult);

    const exploreContextMenuItems = [
      {
        label: 'Explore with Sheets',
        onClick: () => {
          console.log('sheet');
        },
      },
      {
        label: 'Explore with Data Studio',
        onClick: () => {
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
        },
      },
    ];

    return (
      <div
        className={
          this.props.editorType === 'IN_CELL'
            ? localStyles.inCell
            : localStyles.resultsContainer
        }
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <Header text="Query results" />
          <DropDown
            items={exploreContextMenuItems}
            label="Explore Data"
            buttonArgs={{
              startIcon: <Equalizer fontSize="small" />,
              endIcon: <ArrowDropDown fontSize="small" />,
            }}
          />
        </div>
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
