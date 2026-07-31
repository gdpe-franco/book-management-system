import type { Pool, RowDataPacket } from 'mysql2/promise';
import type { AuditLog, AuditLogPage, AuditLogQuery } from '../../domain/audit-log.js';
import type { AuditLogReader } from '../../application/audit-logs/ports/audit-log-reader.js';

type NormalizedQuery = Required<Pick<AuditLogQuery, 'page' | 'perPage'>> & Omit<AuditLogQuery, 'page' | 'perPage'>;

export class MysqlAuditLogReader implements AuditLogReader {
  constructor(private readonly pool: Pick<Pool, 'execute'>) {}

  async list(query: NormalizedQuery): Promise<AuditLogPage> {
    const { where, parameters } = conditions(query);
    const [countRows] = await this.pool.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM audit_logs${where}`, parameters);
    const total = Number(countRows[0]?.total ?? 0);
    const [rows] = await this.pool.execute<RowDataPacket[]>(`
      SELECT event_id, event_type, event_version, occurred_at, actor_id, book_snapshot, changes, persisted_at
      FROM audit_logs${where}
      ${orderBy(query)}
      LIMIT ?, ?
    `, [...parameters, String((query.page - 1) * query.perPage), String(query.perPage)]);

    return {
      data: rows.map(toAuditLog),
      currentPage: query.page,
      lastPage: Math.max(1, Math.ceil(total / query.perPage)),
      perPage: query.perPage,
      total,
    };
  }
}

function conditions(query: NormalizedQuery): { where: string; parameters: Array<string | Date> } {
  const clauses: string[] = [];
  const parameters: Array<string | Date> = [];

  if (query.search !== undefined) {
    clauses.push(`(
      LOWER(event_type) LIKE LOWER(?)
      OR LOWER(event_id) LIKE LOWER(?)
      OR LOWER(JSON_UNQUOTE(JSON_EXTRACT(book_snapshot, '$.title'))) LIKE LOWER(?)
    )`);
    parameters.push(`%${query.search}%`, `%${query.search}%`, `%${query.search}%`);
  }

  return { where: clauses.length === 0 ? '' : ` WHERE ${clauses.join(' AND ')}`, parameters };
}

function orderBy(query: NormalizedQuery): string {
  if (query.sortBy === undefined) {
    return 'ORDER BY occurred_at DESC, persisted_at DESC, event_id DESC';
  }

  const column = {
    event_type: 'event_type',
    event_id: 'event_id',
    actor_id: 'actor_id',
    occurred_at: 'occurred_at',
  }[query.sortBy];
  const direction = query.sortDirection ?? 'asc';

  return `ORDER BY ${column} ${direction.toUpperCase()}, event_id ${direction.toUpperCase()}`;
}

function toAuditLog(row: RowDataPacket): AuditLog {
  return {
    eventId: row.event_id,
    eventType: row.event_type,
    eventVersion: row.event_version,
    occurredAt: toDate(row.occurred_at),
    actorId: row.actor_id,
    bookSnapshot: row.book_snapshot,
    changes: row.changes,
    persistedAt: toDate(row.persisted_at),
  };
}

function toDate(value: unknown): Date {
  return value instanceof Date ? value : new Date(String(value));
}
