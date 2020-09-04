export type QueryType = 'MODEL' | 'TABLE' | 'VIEW';

export function getStarterQuery(
  type: QueryType,
  resourceId: string,
  legacySql?: boolean
) {
  if (type === 'MODEL') {
    return `SELECT * FROM ML.PREDICT(MODEL \`${resourceId}\`, )`;
  } else {
    if (legacySql) {
      return `SELECT * FROM [${resourceId}] LIMIT 1000`;
    } else {
      return `SELECT * FROM \`${resourceId}\` LIMIT 1000`;
    }
  }
}
