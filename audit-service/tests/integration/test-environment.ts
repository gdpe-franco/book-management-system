export function assertMysqlTestEnvironment(): void {
  if (process.env.MYSQL_TEST_DATABASE !== 'audit_testing') {
    throw new Error('Integration tests must use the audit_testing database.');
  }
}

export function assertRedisTestEnvironment(): void {
  if (process.env.REDIS_TEST_DB !== '2') {
    throw new Error('Integration tests must use Redis database 2.');
  }
}
