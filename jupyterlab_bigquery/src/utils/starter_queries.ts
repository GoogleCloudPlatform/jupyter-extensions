export function getStarterQuery(
  type: 'MODEL' | 'TABLE' | 'VIEW',
  resourceId: string
) {
  console.log('type: ', type);
  if (type === 'MODEL') {
    return `SELECT * FROM ML.PREDICT(MODEL \`${resourceId}\`, )`;
  } else {
    return `SELECT * FROM \`${resourceId}\` LIMIT 1000`;
  }
}
