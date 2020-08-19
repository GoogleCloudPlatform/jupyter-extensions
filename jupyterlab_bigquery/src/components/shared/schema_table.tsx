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

// TODO: style for dark mode. Currently defaults to bordercolor3
export const TableHeadCell: React.ComponentType<any> = withStyles({
  root: {
    color: 'var(--jp-ui-font-color1)',
    backgroundColor:
      document.body.getAttribute('data-jp-theme-light') === 'true'
        ? '#fafafa'
        : 'var(--jp-border-color3)',
    whiteSpace: 'nowrap',
    fontSize: '13px',
    padding: '4px 16px 4px 16px',
    border: 0,
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
    color: 'var(--jp-ui-font-color1)',
    fontSize: '13px',
    BASE_FONT,
    border: 0,
  },
})(TableCell);

export const StyledTableRow = withStyles({
  root: {
    borderBottom: '1px solid var(--jp-border-color2)',
  },
})(TableRow);

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
      <TableBody
        style={{
          backgroundColor: 'var(--jp-layout-color0)',
        }}
      >
        {props.schema.map((field, index) => {
          return (
            <StyledTableRow key={`schema_row_${index}`}>
              <StyledTableCell>{formatFieldName(field.name)}</StyledTableCell>
              <StyledTableCell>{field.type}</StyledTableCell>
              <StyledTableCell>{field.mode}</StyledTableCell>
              <StyledTableCell>{field.description ?? ''}</StyledTableCell>
            </StyledTableRow>
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
      <TableBody
        style={{
          color: 'var(--jp-ui-font-color1)',
          backgroundColor: 'var(--jp-layout-color0)',
        }}
      >
        {props.schema.map((field, index) => {
          return (
            <StyledTableRow key={`schema_row_${index}`}>
              <StyledTableCell>{formatFieldName(field.name)}</StyledTableCell>
              <StyledTableCell>{field.type}</StyledTableCell>
            </StyledTableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
