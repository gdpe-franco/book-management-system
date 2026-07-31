import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { InvalidAuditLogQuery, ListAuditLogs } from '../application/audit-logs/list-audit-logs.js';
import { auditLogPayload } from '../application/audit-logs/audit-log-payload.js';
import { ValidateAuditAccess } from '../application/authentication/validate-audit-access.js';
import type { AuditLogQuery } from '../domain/audit-log.js';

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
      data: page.data.map(auditLogPayload),
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
    search: parameters.get('search') ?? undefined,
    sortBy: (parameters.get('sort_by') ?? undefined) as AuditLogQuery['sortBy'],
    sortDirection: (parameters.get('sort_direction') ?? undefined) as AuditLogQuery['sortDirection'],
  };
}

function numberParameter(value: string | null): number | undefined {
  return value === null ? undefined : Number(value);
}

function writeJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(body));
}
