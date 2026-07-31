import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { InvalidAuditLogQuery, ListAuditLogs } from '../application/audit-logs/list-audit-logs.js';
import { ValidateAuditAccess } from '../application/authentication/validate-audit-access.js';
import type { AuditLog, AuditLogQuery } from '../domain/audit-log.js';

export function createHealthServer(): Server {
  return createServer((request, response) => {
    if (request.method === 'GET' && request.url === '/health') {
      writeJson(response, 200, { status: 'ok' });

      return;
    }

    response.writeHead(404);
    response.end();
  });
}

export function createAuditServer(validateAuditAccess: ValidateAuditAccess, listAuditLogs: ListAuditLogs): Server {
  return createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://audit-service');

    if (request.method === 'GET' && url.pathname === '/health') {
      writeJson(response, 200, { status: 'ok' });

      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/v1/audit-logs') {
      await auditLogs(request, response, url, validateAuditAccess, listAuditLogs);

      return;
    }

    response.writeHead(404);
    response.end();
  });
}

async function auditLogs(
  request: IncomingMessage,
  response: ServerResponse,
  url: URL,
  validateAuditAccess: ValidateAuditAccess,
  listAuditLogs: ListAuditLogs,
): Promise<void> {
  const validation = await validateAuditAccess.execute(request.headers.authorization);

  if (validation === 'invalid') {
    writeJson(response, 401, { message: 'Unauthenticated.' });

    return;
  }

  if (validation === 'unavailable') {
    writeJson(response, 500, { message: 'Server error.' });

    return;
  }

  try {
    const page = await listAuditLogs.execute(queryFrom(url.searchParams));

    writeJson(response, 200, {
      data: page.data.map(auditLogResponse),
      meta: {
        current_page: page.currentPage,
        last_page: page.lastPage,
        per_page: page.perPage,
        total: page.total,
      },
    });
  } catch (error) {
    if (error instanceof InvalidAuditLogQuery) {
      writeJson(response, 422, {
        message: 'The given data was invalid.',
        errors: { query: ['Invalid Audit-history query.'] },
      });

      return;
    }

    writeJson(response, 500, { message: 'Server error.' });
  }
}

function queryFrom(parameters: URLSearchParams): AuditLogQuery {
  return {
    page: numberParameter(parameters.get('page')),
    perPage: numberParameter(parameters.get('per_page')),
    eventType: (parameters.get('event_type') ?? undefined) as AuditLogQuery['eventType'],
    occurredFrom: dateParameter(parameters.get('occurred_from')),
    occurredTo: dateParameter(parameters.get('occurred_to')),
  };
}

function numberParameter(value: string | null): number | undefined {
  return value === null ? undefined : Number(value);
}

function dateParameter(value: string | null): Date | undefined {
  return value === null ? undefined : new Date(value);
}

function auditLogResponse(log: AuditLog): Record<string, unknown> {
  return {
    event_id: log.eventId,
    event_type: log.eventType,
    event_version: log.eventVersion,
    occurred_at: utcSeconds(log.occurredAt),
    actor_id: log.actorId,
    book_snapshot: log.bookSnapshot,
    changes: log.changes,
    persisted_at: utcSeconds(log.persistedAt),
  };
}

function utcSeconds(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function writeJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(body));
}
