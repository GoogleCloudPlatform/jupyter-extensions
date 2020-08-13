import React, { FormEvent, useMemo } from 'react';
import {
  Box,
  Button,
  Chip,
  TextField,
  MenuItem,
  Grid,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import {
  TemporaryParameter,
  TemporaryParameterMetadata,
  TemporaryParameterCategoricalMetadata,
  TemporaryParameterIntegerMetadata,
  TemporaryParameterDoubleMetadata,
  TemporaryParameterDiscreteMetadata,
  TemporaryParentParameter,
  TemporaryParameterChildMetadata,
} from './types';
import { makeStyles } from '@material-ui/core/styles';
import { ParameterTypeList, ParameterType } from '../../types';
import {
  ParameterListInput,
  ParameterNumberInput,
} from './parameter_type_inputs';
import { ChipBox, ChipBoxHeader, ChipBoxBody } from '../misc/ChipBox';
import { isParentParameter } from './utils';

const useStyles = makeStyles(theme => ({
  chip: {
    margin: theme.spacing(0.5),
  },
}));

interface Props {
  parameters?: TemporaryParameter[];
  onChange?: (parameters: TemporaryParameter[]) => void;
}

export const ParameterList: React.FC<Props> = ({
  parameters = [],
  onChange,
}) => {
  const styles = useStyles();

  // state
  const [editing, setEditing] = React.useState(false);

  const [name, setName] = React.useState('');
  const [type, setType] = React.useState<ParameterType>(
    'PARAMETER_TYPE_UNSPECIFIED'
  );
  const [parentMetadata, setParentMetadata] = React.useState<
    undefined | TemporaryParameterChildMetadata
  >(undefined);
  // specific to parameter type
  const [metadata, setMetadata] = React.useState<TemporaryParameterMetadata>(
    {}
  );

  // computed
  const validParentParameters = useMemo(
    () =>
      parameters.filter(
        parameter => parameter.name !== name && isParentParameter(parameter)
      ) as TemporaryParentParameter[],
    [parameters]
  );

  // functions
  const removeParameter = (name: string) => {
    if (onChange) {
      onChange(parameters.filter(parameter => parameter.name !== name));
    }
  };

  const stopEditing = () => {
    setEditing(false);
    setName('');
    setType('PARAMETER_TYPE_UNSPECIFIED');
    setParentMetadata(undefined);
  };

  const selectParameter = (name: string) => {
    const found = parameters.find(parameter => parameter.name === name);
    if (found) {
      setName(found.name);
      setType(found.type);
      setMetadata(found.metadata);
      setParentMetadata(found.parent);
      setEditing(true);
    }
  };

  const addParameter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (onChange) {
      // type should always match the correct metadata
      const newParameter = ({
        name,
        type,
        metadata,
        parent: parentMetadata,
      } as unknown) as TemporaryParameter;

      const existingIndex = parameters.findIndex(
        parameter => parameter.name === name
      );
      if (existingIndex >= 0) {
        onChange([
          ...parameters.slice(0, existingIndex),
          newParameter,
          ...parameters.slice(existingIndex + 1),
        ]);
      } else {
        onChange([...parameters, newParameter]);
      }
    }
    stopEditing();
  };

  const changeType = (type: ParameterType) => {
    // change metadata
    switch (type) {
      case 'CATEGORICAL': {
        setMetadata({
          valueList: [],
        } as TemporaryParameterCategoricalMetadata);
        break;
      }
      case 'DISCRETE': {
        setMetadata({
          valueList: [],
        } as TemporaryParameterDiscreteMetadata);
        break;
      }
      case 'INTEGER': {
        setMetadata({
          minValue: '',
          maxValue: '',
        } as TemporaryParameterIntegerMetadata);
        break;
      }
      case 'DOUBLE': {
        setMetadata({
          minValue: '',
          maxValue: '',
        } as TemporaryParameterDoubleMetadata);
        break;
      }
      default: {
        setMetadata({});
        break;
      }
    }
    setType(type);
  };

  const getMetadataInput = () => {
    // TODO: validation
    switch (type) {
      case 'DOUBLE':
      case 'INTEGER':
        return (
          <ParameterNumberInput
            type={type}
            metadata={
              metadata as
                | TemporaryParameterDoubleMetadata
                | TemporaryParameterIntegerMetadata
            }
            onChange={setMetadata}
            parentParameters={validParentParameters}
            parentMetadata={parentMetadata}
            onChangeParentMetadata={setParentMetadata}
          />
        );
      case 'CATEGORICAL':
      case 'DISCRETE':
        return (
          <ParameterListInput
            metadata={
              metadata as
                | TemporaryParameterDiscreteMetadata
                | TemporaryParameterCategoricalMetadata
            }
            onChange={setMetadata}
            parentParameters={validParentParameters}
            parentMetadata={parentMetadata}
            onChangeParentMetadata={setParentMetadata}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ChipBox>
      <ChipBoxHeader>
        {parameters.length === 0 ? (
          <>No parameters set</>
        ) : (
          parameters.map(parameter => (
            <li key={parameter.name} data-testid="paramChip">
              <Chip
                className={styles.chip}
                color="primary"
                label={parameter.name}
                onClick={() => selectParameter(parameter.name)}
                deleteIcon={<CloseIcon data-testid="deleteParameter" />}
                onDelete={() => removeParameter(parameter.name)}
              />
            </li>
          ))
        )}
      </ChipBoxHeader>

      <ChipBoxBody>
        {/* Button */}
        {!editing ? (
          <Box display="flex">
            <Box clone m="auto">
              <Button color="primary" onClick={() => setEditing(true)}>
                Add parameter
              </Button>
            </Box>
          </Box>
        ) : (
          <form onSubmit={addParameter}>
            <Grid container spacing={3}>
              {/* Parameter Name */}
              <Grid item xs={12}>
                <TextField
                  required
                  variant="outlined"
                  id="paramName"
                  name="paramName"
                  label="Parameter Name"
                  fullWidth
                  value={name}
                  onChange={event => setName(event.target.value)}
                />
              </Grid>

              {/* Parameter Type */}
              <Grid item xs={12}>
                <TextField
                  id="paramType"
                  variant="outlined"
                  select
                  label="Parameter Type"
                  value={type}
                  onChange={event =>
                    changeType(event.target.value as ParameterType)
                  }
                  fullWidth
                  required
                >
                  {ParameterTypeList.map(parameterType => (
                    <MenuItem
                      key={parameterType}
                      value={parameterType}
                      data-testid="paramType"
                    >
                      {parameterType}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {getMetadataInput()}

              <Grid item xs={12}>
                <Box clone mr={2}>
                  <Button color="primary" variant="outlined" type="submit">
                    Save
                  </Button>
                </Box>
                <Button color="primary" onClick={stopEditing}>
                  Cancel
                </Button>
              </Grid>
            </Grid>
          </form>
        )}
      </ChipBoxBody>
    </ChipBox>
  );
};
