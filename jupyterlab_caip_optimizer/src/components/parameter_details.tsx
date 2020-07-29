import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@material-ui/core';
import { ParameterSpec } from '../types';

interface Props {
  spec: ParameterSpec;
}

type FormattedParameter = string;

function formatParam(spec: ParameterSpec): FormattedParameter {
  switch (spec.type) {
    case 'DISCRETE':
      return spec.discreteValueSpec.values.join(', ');
    case 'CATEGORICAL':
      return spec.categoricalValueSpec.values.join(', ');
    case 'DOUBLE':
      return `min: ${spec.doubleValueSpec.minValue}, max: ${spec.doubleValueSpec.maxValue}`;
    case 'INTEGER':
      return `min: ${spec.integerValueSpec.minValue}, max: ${spec.integerValueSpec.maxValue}`;
  }
}

export const ParameterDetails: React.FC<Props> = ({ spec }) => {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Study Configuration</TableCell>
            <TableCell align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell component="th" scope="row">
              Name
            </TableCell>
            <TableCell align="right">{spec.parameter}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              Type
            </TableCell>
            <TableCell align="right">{spec.type}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              Values
            </TableCell>
            <TableCell align="right">{formatParam(spec)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};
