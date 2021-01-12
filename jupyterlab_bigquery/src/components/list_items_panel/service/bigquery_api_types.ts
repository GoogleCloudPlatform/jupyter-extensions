
export interface DatasetList {
  kind: string;
  etag: string;
  nextPageToken: string;
  datasets: Dataset[];
}

export interface Dataset {
  kind: string;
  id: string;
  datasetReference: DatasetReference;
  labels;
  friendlyName: string;
  location: string;
}

export interface DatasetReference {
  datasetId: string;
  projectId: string;
}

export interface TableList {
  kind: string;
  etag: string;
  nextPageToken: string;
  tables: Table[];
  totalItems: number;
}

export interface Table {
  kind: string;
  etag: string;
  id: string;
  selfLink: string;
  tableReference: TableReference;
  friendlyName: string;
  description: string;
  labels;
  schema: TableSchema;
  timePartitioning: TimePartitioning;
  rangePartitioning: RangePartitioning;
  clustering: Clustering;
  requirePartitionFilter: boolean;
  numBytes: string;
  numLongTermBytes: string;
  numRows: string;
  creationTime: string;
  expirationTime: string;
  lastModifiedTime: string;
  type: string;
  view: ViewDefinition;
  externalDataConfiguration: ExternalDataConfiguration
  location: string;
  streamingBuffer: Streamingbuffer;
  encryptionConfiguration: EncryptionConfiguration;
  snapshotDefinition: SnapshotDefinition;
}

export interface TableReference {
  projectId: string;
  datasetId: string;
  tableId: string;
}

export interface TableSchema {
  fields: [
    TableFieldSchema
  ];
}

export interface TableFieldSchema {
  name: string;
  type: string;
  mode: string;
  fields: [
    TableFieldSchema
  ];
  description: string;
  policyTags: {
    names: [
      string
    ]
  };
}

export interface TimePartitioning {
  type: string;
  expirationMs: string;
  field: string;
  requirePartitionFilter: boolean
}

export interface RangePartitioning {
  field: string;
  range: {
    start: string;
    end: string;
    interval: string;
  }
}

export interface Clustering {
  fields: [
    string
  ]
}

export interface ViewDefinition {
  query: string;
  userDefinedFunctionResources: [
    {
      UserDefinedFunctionResource
    }
  ];
  useLegacySql: boolean;
}

export interface UserDefinedFunctionResource {
  resourceUri: string;
  inlineCode: string;
}

export interface ExternalDataConfiguration {
  sourceUris: [
    string
  ];
  schema: TableSchema;
  sourceFormat: string;
  maxBadRecords: number;
  autodetect: boolean;
  ignoreUnknownValues: boolean;
  compression: string;
  csvOptions: CsvOptions;
  bigtableOptions: BigtableOptions;
  googleSheetsOptions: GoogleSheetsOptions;
  hivePartitioningOptions: HivePartitioningOptions;
  connectionId: string;
  decimalTargetTypes: [
    DecimalTargetType
  ];
}

export interface CsvOptions {
  fieldDelimiter: string;
  skipLeadingRows: string;
  quote: string;
  allowQuotedNewlines: boolean;
  allowJaggedRows: boolean;
  encoding: string;
}

export interface BigtableOptions {
  columnFamilies: [
    BigtableColumnFamily
  ];
  ignoreUnspecifiedColumnFamilies: boolean;
  readRowkeyAsString: boolean;
}
export interface BigtableColumnFamily {
  familyId: string;
  type: string;
  encoding: string;
  columns: [
    BigtableColumn
  ];
  onlyReadLatest: boolean;
}

export interface BigtableColumn {
  qualifierEncoded: string;
  qualifierString: string;
  fieldName: string;
  type: string;
  encoding: string;
  onlyReadLatest: boolean;
}

export interface GoogleSheetsOptions {

  skipLeadingRows: string;
  range: string
}
export interface HivePartitioningOptions {
  mode: string;
  sourceUriPrefix: string;
  requirePartitionFilter: boolean;
  fields: [
    string
  ];
}

export interface DecimalTargetType {
  estimatedBytes: string;
  estimatedRows: string;
  oldestEntryTime: string;
}

export interface Streamingbuffer {
  estimatedBytes: string;
  estimatedRows: string;
  oldestEntryTime: string;
}

export interface EncryptionConfiguration {
  kmsKeyName: string;
}

export interface SnapshotDefinition {
  baseTableReference: TableReference;
  snapshotTime: string;
}

export interface ModelList {
  models: [
    Model
  ];
  nextPageToken: string;
}

type ModelType = string;

export interface Model {
  etag: string;
  modelReference: ModelReference;
  creationTime: string;
  lastModifiedTime: string;
  description: string;
  friendlyName: string;
  labels;
  expirationTime: string;
  location: string;
  encryptionConfiguration: EncryptionConfiguration;
  modelType: ModelType;
  trainingRuns: [
    TrainingRun
  ];
  featureColumns: [
    StandardSqlField
  ];
  labelColumns: [
    StandardSqlField
  ];
}

export interface ModelReference {
  projectId: string;
  datasetId: string;
  modelId: string;
}

export interface TrainingRun {
  trainingOptions: any; // TrainingOptions
  startTime: string,
  results: [
    any // IterationResult
  ],
  evaluationMetrics: any; // EvaluationMetrics
  dataSplitResult: any; // DataSplitResult
  globalExplanations: [
    any // GlobalExplanation
  ]
}

export interface StandardSqlField {
  name: string;
  type: StandardSqlDataType;
}

type TypeKind = string;

export interface StandardSqlDataType {
  typeKind: TypeKind;
  // Union field sub_type can be only one of the following:
  arrayElementType: StandardSqlDataType;
  structType: StandardSqlStructType;
  // End of list of possible types for union field sub_type.
}

export interface StandardSqlStructType {
  fields: [
    StandardSqlField
  ]
}

