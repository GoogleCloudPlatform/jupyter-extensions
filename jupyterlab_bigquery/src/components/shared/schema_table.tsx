import * as React from 'react';
import { stylesheet } from 'typestyle';

import {
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
  withStyles,
} from '@material-ui/core';

import { BASE_FONT } from 'gcp_jupyterlab_shared';

export const localStyles = stylesheet({
  bold: {
    fontWeight: 500,
  },
});

export const TableHeadCell: React.ComponentType<any> = withStyles({
  root: {
    backgroundColor: '#f8f9fa',
    whiteSpace: 'nowrap',
    fontSize: '13px',
    padding: '4px 16px 4px 16px',
    borderTop: '1px  solid var(--jp-border-color2)',
    BASE_FONT,
  },
})(TableCell);

const formatFieldName = name => {
  if (name.includes('.')) {
    const child = name.substr(name.lastIndexOf('.') + 1);
    const parents = name.substr(0, name.lastIndexOf('.') + 1);
    return (
      <div>
        <span style={{ color: 'gray' }}>{parents}</span>{' '}
        <span className={localStyles.bold}>{child}</span>
      </div>
    );
  } else {
    return <div className={localStyles.bold}>{name}</div>;
  }
};

const StyledTableCell = withStyles({
  root: {
    fontSize: '13px',
    BASE_FONT,
  },
})(TableCell);

export const SchemaTable = (props: { schema: any }) => {
  return (
    <Table size="small" style={{ width: 'auto', tableLayout: 'auto' }}>
      <TableHead>
        <TableRow>
          <TableHeadCell>Field name</TableHeadCell>
          <TableHeadCell>Type</TableHeadCell>
          <TableHeadCell>Mode</TableHeadCell>
          <TableHeadCell>Description</TableHeadCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {props.schema.map((field, index) => {
          return (
            <TableRow key={`schema_row_${index}`}>
              <StyledTableCell>{formatFieldName(field.name)}</StyledTableCell>
              <StyledTableCell>{field.type}</StyledTableCell>
              <StyledTableCell>{field.mode}</StyledTableCell>
              <StyledTableCell>{field.description ?? ''}</StyledTableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export const ModelSchemaTable = (props: { schema: any }) => {
  return (
    <Table size="small" style={{ width: 'auto', tableLayout: 'auto' }}>
      <TableHead>
        <TableRow>
          <TableHeadCell>Field name</TableHeadCell>
          <TableHeadCell>Type</TableHeadCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {props.schema.map((field, index) => {
          return (
            <TableRow key={`schema_row_${index}`}>
              <StyledTableCell>{formatFieldName(field.name)}</StyledTableCell>
              <StyledTableCell>{field.type}</StyledTableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
