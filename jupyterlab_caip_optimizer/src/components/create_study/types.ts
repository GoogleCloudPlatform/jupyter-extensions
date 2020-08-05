export interface DropdownItem {
  value: string;
  label: string;
}

export type TemporaryParameterChildMetadata = {
  name: string;
  validFor: string[];
};

export type TemporaryParameterParentMetadata = {
  name: string;
  // Valid for certain parent values
  validFor: string[];
};

export type TemporaryParameterBase = {
  name: string;
  parent?: TemporaryParameterChildMetadata;
};

export type TemporaryParameterUnspecifiedMetadata = {};
export type TemporaryParameterUnspecified = TemporaryParameterBase & {
  type: 'PARAMETER_TYPE_UNSPECIFIED';
  metadata: TemporaryParameterUnspecifiedMetadata;
};

export type TemporaryParameterDoubleMetadata = {
  minValue: string;
  maxValue: string;
};
export type TemporaryParameterDouble = TemporaryParameterBase &
  TemporaryParameterChildMetadata & {
    type: 'DOUBLE';
    metadata: TemporaryParameterDoubleMetadata;
  };

export type TemporaryParameterIntegerMetadata = {
  minValue: string;
  maxValue: string;
};
export type TemporaryParameterInteger = TemporaryParameterBase &
  TemporaryParameterChildMetadata & {
    type: 'INTEGER';
    metadata: TemporaryParameterIntegerMetadata;
    children?: TemporaryParameterParentMetadata[];
  };

export type TemporaryParameterDiscreteMetadata = {
  // NOTE: this is a string list not a number list!
  valueList: string[];
};
export type TemporaryParameterDiscrete = TemporaryParameterBase &
  TemporaryParameterChildMetadata & {
    type: 'DISCRETE';
    metadata: TemporaryParameterDiscreteMetadata;
    children?: TemporaryParameterParentMetadata[];
  };

export type TemporaryParameterCategoricalMetadata = {
  valueList: string[];
};
export type TemporaryParameterCategorical = TemporaryParameterBase &
  TemporaryParameterChildMetadata & {
    type: 'CATEGORICAL';
    metadata: TemporaryParameterCategoricalMetadata;
    children?: TemporaryParameterParentMetadata[];
  };

export type TemporaryParameterMetadata =
  | TemporaryParameterUnspecifiedMetadata
  | TemporaryParameterDoubleMetadata
  | TemporaryParameterIntegerMetadata
  | TemporaryParameterDiscreteMetadata
  | TemporaryParameterCategoricalMetadata;

export type TemporaryParentParameter =
  | TemporaryParameterInteger
  | TemporaryParameterDiscrete
  | TemporaryParameterCategorical;

export type TemporaryParameter =
  | TemporaryParameterUnspecified
  | TemporaryParameterDouble
  | TemporaryParameterInteger
  | TemporaryParameterDiscrete
  | TemporaryParameterCategorical;
