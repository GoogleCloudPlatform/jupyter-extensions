import * as React from 'react';

import { Grid, Chip, withStyles } from '@material-ui/core';
import { stylesheet } from 'typestyle';

import ReadOnlyEditor from '../shared/read_only_editor';
import { SchemaField } from './service/list_table_details';
import { ModelSchema } from './service/list_model_details';
import { StripedRows } from '../shared/striped_rows';
import { SchemaTable, ModelSchemaTable } from '../shared/schema_table';

export const localStyles = stylesheet({
  title: {
    fontSize: '16px',
    marginBottom: '10px',
  },
  panel: {
    backgroundColor: 'var(--jp-layout-color0)',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  detailsBody: {
    fontSize: '13px',
    marginTop: '24px',
    marginBottom: '24px',
  },
  labelContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    '& > *': {
      marginRight: '8px',
      marginBottom: '8px',
    },
  },
  rowTitle: {
    width: '150px',
  },
  row: {
    display: 'flex',
    padding: '6px',
  },
  bold: {
    fontWeight: 500,
  },
});

interface ChipProps {
  darkMode: boolean;
  size?: 'medium' | 'small';
  component?: any;
  key?: string | number;
  label: string;
}

const StyledChip = withStyles({
  root: {
    color: (props: ChipProps) =>
      // white :  blue600
      props.darkMode ? 'var(--jp-ui-font-color1)' : '#1A73E8',
    backgroundColor: (props: ChipProps) =>
      // blue300 at 30% opacity : blue600 at 10% opacity
      props.darkMode ? 'rgba(138, 180, 248, 0.3)' : 'rgba(26, 115, 232, 0.1)',
  },
})((props: ChipProps) => <Chip {...props} />);

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
  trainingRows?: any[];
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
  const { details, rows, detailsType, trainingRows } = props;

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
                    return (
                      <StyledChip
                        size="small"
                        key={index}
                        label={value}
                        darkMode={
                          document.body.getAttribute('data-jp-theme-light') ===
                          'false'
                        }
                      />
                    );
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

          {detailsType === 'MODEL' && (
            <Grid item xs={12}>
              <div className={localStyles.title}>Training options</div>
              {trainingRows && <StripedRows rows={trainingRows} />}
            </Grid>
          )}

          {(detailsType === 'TABLE' || detailsType === 'VIEW') && (
            <Grid item xs={12}>
              <div className={localStyles.title}>Schema</div>
              {details.schema && details.schema.length > 0 ? (
                <SchemaTable schema={details.schema} />
              ) : (
                'Table does not have a schema.'
              )}
            </Grid>
          )}

          {detailsType === 'VIEW' && (
            <Grid item xs={12}>
              <div className={localStyles.title}>Query</div>
              <ReadOnlyEditor query={details.query} />
            </Grid>
          )}

          {detailsType === 'MODEL' && (
            <Grid item xs={12}>
              <div className={localStyles.title}>Label columns</div>
              <div>
                {details.schema_labels && details.schema_labels.length > 0 ? (
                  <ModelSchemaTable schema={details.schema_labels} />
                ) : (
                  'Model does not have any label columns.'
                )}
              </div>
            </Grid>
          )}

          {detailsType === 'MODEL' && (
            <Grid item xs={12}>
              <div className={localStyles.title}>Feature columns</div>
              <div>
                {details.feature_columns &&
                details.feature_columns.length > 0 ? (
                  <ModelSchemaTable schema={details.feature_columns} />
                ) : (
                  'Model does not have any feature columns.'
                )}
              </div>
            </Grid>
          )}
        </Grid>
      </div>
    </div>
  );
};
