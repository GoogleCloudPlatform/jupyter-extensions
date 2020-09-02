type QueryType = 'MODEL' | 'TABLE' | 'VIEW';

export function getStarterQuery(type: QueryType, resourceId: string) {
  if (type === 'MODEL') {
    return `SELECT * FROM ML.PREDICT(MODEL \`${resourceId}\`, )`;
  } else {
    return `SELECT * FROM \`${resourceId}\` LIMIT 1000`;
  }
}
