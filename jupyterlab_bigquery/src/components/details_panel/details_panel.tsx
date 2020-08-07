import * as React from 'react';

import {
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  withStyles,
} from '@material-ui/core';
import { stylesheet } from 'typestyle';
import Editor from '@monaco-editor/react';
import { monaco } from '@monaco-editor/react';

import { SchemaField } from './service/list_table_details';
import { ModelSchema } from './service/list_model_details';
import { StripedRows } from '../shared/striped_rows';

export const localStyles = stylesheet({
  header: {
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
    fontSize: '18px',
    margin: 0,
    padding: '8px 12px 8px 24px',
  },
  title: {
    fontSize: '16px',
    marginBottom: '8px',
  },
  panel: {
    backgroundColor: 'white',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  detailsBody: {
    fontSize: '13px',
    marginTop: '24px',
  },
  labelContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    '& > *': {
      margin: '4px',
    },
  },
  rowTitle: {
    width: '200px',
  },
  row: {
    display: 'flex',
    padding: '6px',
  },
});

export const TableHeadCell: React.ComponentType<any> = withStyles({
  root: {
    backgroundColor: '#f0f0f0',
  },
})(TableCell);

const formatFieldName = name => {
  if (name.includes('.')) {
    const child = name.substr(name.lastIndexOf('.') + 1);
    const parents = name.substr(0, name.lastIndexOf('.') + 1);
    return (
      <div>
        {parents} <b>{child}</b>
      </div>
    );
  } else {
    return <b>{name}</b>;
  }
};

interface SharedDetails {
  id: string;
  description: string;
  labels: string[];
  name: string;
  schema?: SchemaField[];
  query?: string;
  schema_labels?: ModelSchema[];
  feature_columns?: ModelSchema[];
}

interface Props {
  details: SharedDetails;
  rows: any[];
  // TODO(cxjia): figure out a shared typing for these rows
  detailsType: 'DATASET' | 'TABLE' | 'VIEW' | 'MODEL';
}

const getTitle = type => {
  switch (type) {
    case 'DATASET':
      return 'Dataset info';
    case 'TABLE':
      return 'Table info';
    case 'VIEW':
      return 'View info';
    case 'MODEL':
      return 'Model details';
  }
};

export const DetailsPanel: React.SFC<Props> = props => {
  const { details, rows, detailsType } = props;

  function handleEditorDidMount(_, editor) {
    const editorElement = editor.getDomNode();
    if (!editorElement) {
      return;
    }

    monaco
      .init()
      .then(monaco => {
        const lineHeight = editor.getOption(
          monaco.editor.EditorOption.lineHeight
        );
        const lineCount = editor._modelData.viewModel.getLineCount();
        const height = lineCount * lineHeight;
        editorElement.style.height = `${height}px`;
        editor.layout();

        monaco.editor.defineTheme('viewQueryTheme', {
          base: 'vs',
          inherit: true,
          rules: [],
          colors: { 'editorCursor.foreground': '#FFFFFF' },
        });
        monaco.editor.setTheme('viewQueryTheme');
      })
      .catch(error =>
        console.error(
          'An error occurred during initialization of Monaco: ',
          error
        )
      );
  }

  return (
    <div className={localStyles.panel}>
      <div className={localStyles.detailsBody}>
        <Grid container spacing={4}>
          <Grid item xs={6}>
            <div className={localStyles.title}>Description</div>
            <div>{details.description ? details.description : 'None'}</div>
          </Grid>

          <Grid item xs={6}>
            <div>
              <div className={localStyles.title}>Labels</div>
              {details.labels ? (
                <div className={localStyles.labelContainer}>
                  {details.labels.map((value, index) => {
                    return <Chip size="small" key={index} label={value} />;
                  })}
                </div>
              ) : (
                'None'
              )}
            </div>
          </Grid>

          <Grid item xs={12}>
            <div className={localStyles.title}>{getTitle(detailsType)}</div>
            <StripedRows rows={rows} />
          </Grid>
        </Grid>

        {(detailsType === 'TABLE' || detailsType === 'VIEW') && (
          <div>
            <div className={localStyles.title} style={{ marginTop: '32px' }}>
              Schema
            </div>
            {details.schema && details.schema.length > 0 ? (
              <Table
                size="small"
                style={{ width: 'auto', tableLayout: 'auto' }}
              >
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Field name</TableHeadCell>
                    <TableHeadCell>Type</TableHeadCell>
                    <TableHeadCell>Mode</TableHeadCell>
                    <TableHeadCell>Description</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {details.schema.map((field, index) => {
                    return (
                      <TableRow key={`schema_row_${index}`}>
                        <TableCell>{formatFieldName(field.name)}</TableCell>
                        <TableCell>{field.type}</TableCell>
                        <TableCell>{field.mode}</TableCell>
                        <TableCell>{field.description ?? ''}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              'Table does not have a schema.'
            )}
          </div>
        )}

        {detailsType === 'VIEW' && (
          <div>
            <div className={localStyles.title} style={{ marginTop: '32px' }}>
              Query
            </div>
            <Editor
              width="100%"
              theme={'light'}
              language={'sql'}
              value={details.query}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                cursorStyle: 'line-thin',
                cursorWidth: 0,
                renderLineHighlight: 'none',
                overviewRulerLanes: 0,
                overviewRulerBorder: false,
                hideCursorInOverviewRuler: true,
                glyphMargin: true,
                matchBrackets: 'never',
                occurrencesHighlight: false,
                folding: false,
                scrollBeyondLastLine: false,
              }}
              editorDidMount={handleEditorDidMount}
            />
          </div>
        )}

        {detailsType === 'MODEL' && (
          <div>
            <div className={localStyles.title} style={{ marginTop: '32px' }}>
              Label columns
            </div>
            <div>
              {details.schema_labels && details.schema_labels.length > 0 ? (
                <Table
                  size="small"
                  style={{ width: 'auto', tableLayout: 'auto' }}
                >
                  <TableHead>
                    <TableRow>
                      <TableHeadCell>Field name</TableHeadCell>
                      <TableHeadCell>Type</TableHeadCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {details.schema_labels.map((field, index) => {
                      return (
                        <TableRow key={`schema_label_row_${index}`}>
                          <TableCell>{field.name}</TableCell>
                          <TableCell>{field.type}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                'Model does not have any label columns.'
              )}
            </div>

            <div className={localStyles.title} style={{ marginTop: '24px' }}>
              Feature columns
            </div>
            <div>
              {details.feature_columns && details.feature_columns.length > 0 ? (
                <Table
                  size="small"
                  style={{ width: 'auto', tableLayout: 'auto' }}
                >
                  <TableHead>
                    <TableRow>
                      <TableHeadCell>Field name</TableHeadCell>
                      <TableHeadCell>Type</TableHeadCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {details.feature_columns.map((field, index) => {
                      return (
                        <TableRow key={`schema_feature_row_${index}`}>
                          <TableCell>{field.name}</TableCell>
                          <TableCell>{field.type}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                'Model does not have any feature columns.'
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
