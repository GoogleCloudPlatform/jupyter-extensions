/**
 * Cloud Scheduler Job
 * https://cloud.google.com/scheduler/docs/reference/rest/v1/projects.locations.jobs#Job
 */
export interface CloudSchedulerJob {
  name: string;
  description: string;
  schedule: string;
  timeZone: string;
  httpTarget: {
    body: string;
    headers: { [name: string]: string };
    httpMethod: string;
    uri: string;
    oidcToken: { serviceAccountEmail: string };
  };
}

/** Message type describing an AI Platform training Job */
export interface RunNotebookRequest {
  imageUri: string;
  inputNotebookGcsPath: string;
  jobId: string;
  masterType: string;
  outputNotebookGcsPath: string;
  gcsBucket: string;
  scaleTier: string;
  region: string;
  acceleratorType: string;
  acceleratorCount: string;
}

/** List of Jobs returned from AI Platform. */
/* eslint-disable @typescript-eslint/camelcase */
export type ListAiPlatformJobsResponse = gapi.client.ml.GoogleCloudMlV1__ListJobsResponse;

/** Enum to represent the type of the JobRow */
export enum JobRowType {
  SCHEDULED = 'SCHEDULED',
  IMMEDIATE = 'IMMEDIATE',
}

export type JobState =
  | 'STATE_UNSPECIFIED'
  | 'ENABLED'
  | 'PAUSED'
  | 'DISABLED'
  | 'UPDATE_FAILED';

export interface Runs {
  runs: Run[];
  pageToken: string;
}

export interface Schedules {
  schedules: Schedule[];
  pageToken: string;
}

export interface Bucket {
  name: string;
  accessLevel?: 'uniform' | 'fine';
}

export interface Buckets {
  buckets: Bucket[];
}

export interface CloudStorageApiBucket {
  /** Access controls on the bucket. */
  acl?: BucketAccessControl[];
  /** The bucket's billing configuration. */
  billing?: {
    /** When set to true, Requester Pays is enabled for this bucket. */
    requesterPays?: boolean;
  };
  /** The bucket's Cross-Origin Resource Sharing (CORS) configuration. */
  cors?: Array<{
    /** The value, in seconds, to return in the  Access-Control-Max-Age header used in preflight responses. */
    maxAgeSeconds?: number;
    /** The list of HTTP methods on which to include CORS response headers, (GET, OPTIONS, POST, etc) Note: "*" is permitted in the list of methods, and means "any method". */
    method?: string[];
    /** The list of Origins eligible to receive CORS response headers. Note: "*" is permitted in the list of origins, and means "any Origin". */
    origin?: string[];
    /** The list of HTTP headers other than the simple response headers to give permission for the user-agent to share across domains. */
    responseHeader?: string[];
  }>;
  /**
   * The default value for event-based hold on newly created objects in this bucket. Event-based hold is a way to retain objects indefinitely until an event occurs, signified by the
   * hold's release. After being released, such objects will be subject to bucket-level retention (if any). One sample use case of this flag is for banks to hold loan documents for at
   * least 3 years after loan is paid in full. Here, bucket-level retention is 3 years and the event is loan being paid in full. In this example, these objects will be held intact for
   * any number of years until the event has occurred (event-based hold on the object is released) and then 3 more years after that. That means retention duration of the objects begins
   * from the moment event-based hold transitioned from true to false. Objects under event-based hold cannot be deleted, overwritten or archived until the hold is removed.
   */
  defaultEventBasedHold?: boolean;
  /** Default access controls to apply to new objects when no ACL is provided. */
  defaultObjectAcl?: ObjectAccessControl[];
  /** Encryption configuration for a bucket. */
  encryption?: {
    /** A Cloud KMS key that will be used to encrypt objects inserted into this bucket, if no encryption method is specified. */
    defaultKmsKeyName?: string;
  };
  /** HTTP 1.1 Entity tag for the bucket. */
  etag?: string;
  /** The bucket's IAM configuration. */
  iamConfiguration?: {
    /**
     * The bucket's uniform bucket-level access configuration. The feature was formerly known as CloudStorageApiBucket Policy Only. For backward compatibility, this field will be populated with
     * identical information as the uniformBucketLevelAccess field. We recommend using the uniformBucketLevelAccess field to enable and disable the feature.
     */
    bucketPolicyOnly?: {
      /** If set, access is controlled only by bucket-level or above IAM policies. */
      enabled?: boolean;
      /**
       * The deadline for changing iamConfiguration.bucketPolicyOnly.enabled from true to false in RFC 3339 format. iamConfiguration.bucketPolicyOnly.enabled may be changed from true
       * to false until the locked time, after which the field is immutable.
       */
      lockedTime?: string;
    };
    /** The bucket's Public Access Prevention configuration. Currently, 'unspecified' and 'enforced' are supported. */
    publicAccessPrevention?: string;
    /** The bucket's uniform bucket-level access configuration. */
    uniformBucketLevelAccess?: {
      /** If set, access is controlled only by bucket-level or above IAM policies. */
      enabled?: boolean;
      /**
       * The deadline for changing iamConfiguration.uniformBucketLevelAccess.enabled from true to false in RFC 3339  format. iamConfiguration.uniformBucketLevelAccess.enabled may be
       * changed from true to false until the locked time, after which the field is immutable.
       */
      lockedTime?: string;
    };
  };
  /** The ID of the bucket. For buckets, the id and name properties are the same. */
  id?: string;
  /** The kind of item this is. For buckets, this is always storage#bucket. */
  kind?: string;
  /** User-provided labels, in key/value pairs. */
  labels?: { [P in string]: string };
  /** The bucket's lifecycle configuration. See lifecycle management for more information. */
  lifecycle?: {
    /** A lifecycle management rule, which is made of an action to take and the condition(s) under which the action will be taken. */
    rule?: Array<{
      /** The action to take. */
      action?: {
        /** Target storage class. Required iff the type of the action is SetStorageClass. */
        storageClass?: string;
        /** Type of the action. Currently, only Delete and SetStorageClass are supported. */
        type?: string;
      };
      /** The condition(s) under which the action will be taken. */
      condition?: {
        /** Age of an object (in days). This condition is satisfied when an object reaches the specified age. */
        age?: number;
        /**
         * A date in RFC 3339 format with only the date part (for instance, "2013-01-15"). This condition is satisfied when an object is created before midnight of the specified
         * date in UTC.
         */
        createdBefore?: string;
        /** A date in RFC 3339 format with only the date part (for instance, "2013-01-15"). This condition is satisfied when the custom time on an object is before this date in UTC. */
        customTimeBefore?: string;
        /**
         * Number of days elapsed since the user-specified timestamp set on an object. The condition is satisfied if the days elapsed is at least this number. If no custom
         * timestamp is specified on an object, the condition does not apply.
         */
        daysSinceCustomTime?: number;
        /**
         * Number of days elapsed since the noncurrent timestamp of an object. The condition is satisfied if the days elapsed is at least this number. This condition is relevant
         * only for versioned objects. The value of the field must be a nonnegative integer. If it's zero, the object version will become eligible for Lifecycle action as soon as
         * it becomes noncurrent.
         */
        daysSinceNoncurrentTime?: number;
        /** Relevant only for versioned objects. If the value is true, this condition matches live objects; if the value is false, it matches archived objects. */
        isLive?: boolean;
        /**
         * A regular expression that satisfies the RE2 syntax. This condition is satisfied when the name of the object matches the RE2 pattern. Note: This feature is currently in
         * the "Early Access" launch stage and is only available to a whitelisted set of users; that means that this feature may be changed in backward-incompatible ways and that
         * it is not guaranteed to be released.
         */
        matchesPattern?: string;
        /**
         * Objects having any of the storage classes specified by this condition will be matched. Values include MULTI_REGIONAL, REGIONAL, NEARLINE, COLDLINE, ARCHIVE, STANDARD,
         * and DURABLE_REDUCED_AVAILABILITY.
         */
        matchesStorageClass?: string[];
        /**
         * A date in RFC 3339 format with only the date part (for instance, "2013-01-15"). This condition is satisfied when the noncurrent time on an object is before this date in
         * UTC. This condition is relevant only for versioned objects.
         */
        noncurrentTimeBefore?: string;
        /**
         * Relevant only for versioned objects. If the value is N, this condition is satisfied when there are at least N versions (including the live version) newer than this
         * version of the object.
         */
        numNewerVersions?: number;
      };
    }>;
  };
  /**
   * The location of the bucket. Object data for objects in the bucket resides in physical storage within this region. Defaults to US. See the developer's guide for the authoritative
   * list.
   */
  location?: string;
  /** The type of the bucket location. */
  locationType?: string;
  /** The bucket's logging configuration, which defines the destination bucket and optional name prefix for the current bucket's logs. */
  logging?: {
    /** The destination bucket where the current bucket's logs should be placed. */
    logBucket?: string;
    /** A prefix for log object names. */
    logObjectPrefix?: string;
  };
  /** The metadata generation of this bucket. */
  metageneration?: string;
  /** The name of the bucket. */
  name?: string;
  /** The owner of the bucket. This is always the project team's owner group. */
  owner?: {
    /** The entity, in the form project-owner-projectId. */
    entity?: string;
    /** The ID for the entity. */
    entityId?: string;
  };
  /** The project number of the project the bucket belongs to. */
  projectNumber?: string;
  /**
   * The bucket's retention policy. The retention policy enforces a minimum retention time for all objects contained in the bucket, based on their creation time. Any attempt to overwrite
   * or delete objects younger than the retention period will result in a PERMISSION_DENIED error. An unlocked retention policy can be modified or removed from the bucket via a
   * storage.buckets.update operation. A locked retention policy cannot be removed or shortened in duration for the lifetime of the bucket. Attempting to remove or decrease period of a
   * locked retention policy will result in a PERMISSION_DENIED error.
   */
  retentionPolicy?: {
    /** Server-determined value that indicates the time from which policy was enforced and effective. This value is in RFC 3339 format. */
    effectiveTime?: string;
    /** Once locked, an object retention policy cannot be modified. */
    isLocked?: boolean;
    /**
     * The duration in seconds that objects need to be retained. Retention duration must be greater than zero and less than 100 years. Note that enforcement of retention periods less
     * than a day is not guaranteed. Such periods should only be used for testing purposes.
     */
    retentionPeriod?: string;
  };
  /** The URI of this bucket. */
  selfLink?: string;
  /**
   * The bucket's default storage class, used whenever no storageClass is specified for a newly-created object. This defines how objects in the bucket are stored and determines the SLA
   * and the cost of storage. Values include MULTI_REGIONAL, REGIONAL, STANDARD, NEARLINE, COLDLINE, ARCHIVE, and DURABLE_REDUCED_AVAILABILITY. If this value is not specified when the
   * bucket is created, it will default to STANDARD. For more information, see storage classes.
   */
  storageClass?: string;
  /** The creation time of the bucket in RFC 3339 format. */
  timeCreated?: string;
  /** The modification time of the bucket in RFC 3339 format. */
  updated?: string;
  /** The bucket's versioning configuration. */
  versioning?: {
    /** While set to true, versioning is fully enabled for this bucket. */
    enabled?: boolean;
  };
  /** The bucket's website configuration, controlling how the service behaves when accessing bucket contents as a web site. See the Static Website Examples for more information. */
  website?: {
    /**
     * If the requested object path is missing, the service will ensure the path has a trailing '/', append this suffix, and attempt to retrieve the resulting object. This allows the
     * creation of index.html objects to represent directory pages.
     */
    mainPageSuffix?: string;
    /**
     * If the requested object path is missing, and any mainPageSuffix object is missing, if applicable, the service will return the named object from this bucket as the content for a
     * 404 Not Found result.
     */
    notFoundPage?: string;
  };
  /**
   * The zone or zones from which the bucket is intended to use zonal quota. Requests for data from outside the specified affinities are still allowed but won't be able to use zonal
   * quota. The zone or zones need to be within the bucket location otherwise the requests will fail with a 400 Bad Request response.
   */
  zoneAffinity?: string[];
}
export interface ObjectAccessControl {
  /** The name of the bucket. */
  bucket?: string;
  /** The domain associated with the entity, if any. */
  domain?: string;
  /** The email address associated with the entity, if any. */
  email?: string;
  /**
   * The entity holding the permission, in one of the following forms:
   * - user-userId
   * - user-email
   * - group-groupId
   * - group-email
   * - domain-domain
   * - project-team-projectId
   * - allUsers
   * - allAuthenticatedUsers Examples:
   * - The user liz@example.com would be user-liz@example.com.
   * - The group example@googlegroups.com would be group-example@googlegroups.com.
   * - To refer to all members of the Google Apps for Business domain example.com, the entity would be domain-example.com.
   */
  entity?: string;
  /** The ID for the entity, if any. */
  entityId?: string;
  /** HTTP 1.1 Entity tag for the access-control entry. */
  etag?: string;
  /** The content generation of the object, if applied to an object. */
  generation?: string;
  /** The ID of the access-control entry. */
  id?: string;
  /** The kind of item this is. For object access control entries, this is always storage#objectAccessControl. */
  kind?: string;
  /** The name of the object, if applied to an object. */
  object?: string;
  /** The project team associated with the entity, if any. */
  projectTeam?: {
    /** The project number. */
    projectNumber?: string;
    /** The team. */
    team?: string;
  };
  /** The access permission for the entity. */
  role?: string;
  /** The link to this access-control entry. */
  selfLink?: string;
}
export interface BucketAccessControl {
  /** The name of the bucket. */
  bucket?: string;
  /** The domain associated with the entity, if any. */
  domain?: string;
  /** The email address associated with the entity, if any. */
  email?: string;
  /**
   * The entity holding the permission, in one of the following forms:
   * - user-userId
   * - user-email
   * - group-groupId
   * - group-email
   * - domain-domain
   * - project-team-projectId
   * - allUsers
   * - allAuthenticatedUsers Examples:
   * - The user liz@example.com would be user-liz@example.com.
   * - The group example@googlegroups.com would be group-example@googlegroups.com.
   * - To refer to all members of the Google Apps for Business domain example.com, the entity would be domain-example.com.
   */
  entity?: string;
  /** The ID for the entity, if any. */
  entityId?: string;
  /** HTTP 1.1 Entity tag for the access-control entry. */
  etag?: string;
  /** The ID of the access-control entry. */
  id?: string;
  /** The kind of item this is. For bucket access control entries, this is always storage#bucketAccessControl. */
  kind?: string;
  /** The project team associated with the entity, if any. */
  projectTeam?: {
    /** The project number. */
    projectNumber?: string;
    /** The team. */
    team?: string;
  };
  /** The access permission for the entity. */
  role?: string;
  /** The link to this access-control entry. */
  selfLink?: string;
}
export interface CloudStorageApiBuckets {
  /** The list of items. */
  items?: CloudStorageApiBucket[];
  /** The kind of item this is. For lists of buckets, this is always storage#buckets. */
  kind?: string;
  /** The continuation token, used to page through large result sets. Provide this value in a subsequent request to return the next page of results. */
  nextPageToken?: string;
}
export interface Job {
  id: string;
  name: string;
  endTime?: string;
  createTime?: string;
  gcsFile: string;
  state: string;
  link?: string;
  viewerLink?: string;
  downloadLink?: string;
  timeZone?: string;
}

/** UI interface used to represent a Scheduled Notebook Job */
export interface Run extends Job {
  type: string;
  bucketLink?: string;
}

export interface Schedule extends Job {
  schedule: string;
}

/** AI Platform Job. */
/* eslint-disable @typescript-eslint/camelcase */
export type AiPlatformJob = gapi.client.ml.GoogleCloudMlV1__Job;

export type StorageObject = gapi.client.storage.Object;
