import { createPool, type Pool, type PoolOptions } from 'mysql2/promise';

export type MysqlConfig = Pick<PoolOptions, 'host' | 'port' | 'database' | 'user' | 'password'>;

export function mysqlConfigFromEnvironment(prefix = 'MYSQL'): MysqlConfig {
  const read = (name: string): string => {
    const value = process.env[`${prefix}_${name}`];

    if (value === undefined || value === '') {
      throw new Error(`Missing ${prefix}_${name} configuration.`);
    }

    return value;
  };

  const port = Number(read('PORT'));

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid ${prefix}_PORT configuration.`);
  }

  return {
    host: read('HOST'),
    port,
    database: read('DATABASE'),
    user: read('USER'),
    password: read('PASSWORD'),
  };
}

export function createMysqlPool(config: MysqlConfig): Pool {
  return createPool({ ...config, timezone: 'Z' });
}
