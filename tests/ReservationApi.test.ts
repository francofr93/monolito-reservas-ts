import { AddressInfo } from 'node:net';
import { Server } from 'node:http';
import { Pool } from 'pg';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';

const reservationRow = {
  id: '5e0057b7-932f-4fd3-83d6-01d43a95ebf8',
  customer_name: 'Ana Pérez',
  resource_name: 'Sala A',
  starts_at: new Date('2026-11-10T19:00:00.000Z'),
  ends_at: new Date('2026-11-10T20:00:00.000Z'),
  created_at: new Date('2026-11-01T12:00:00.000Z'),
};

const validRequest = {
  customerName: 'Ana Pérez',
  resourceName: 'Sala A',
  startsAt: '2026-11-10T14:00:00-05:00',
  endsAt: '2026-11-10T15:00:00-05:00',
};

const servers: Server[] = [];

async function startApi(query = vi.fn()) {
  const pool = { query } as unknown as Pool;
  const server = createApp(pool).listen(0);
  servers.push(server);
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });

  const address = server.address() as AddressInfo;
  return { baseUrl: `http://127.0.0.1:${address.port}`, query };
}

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) => new Promise<void>((resolve) => server.close(() => resolve())),
    ),
  );
});

describe('API HTTP y contrato OpenAPI', () => {
  it('crea una reserva con la forma de respuesta documentada', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [reservationRow] });
    const { baseUrl } = await startApi(query);

    const response = await fetch(`${baseUrl}/api/reservations`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validRequest),
    });
    const body = (await response.json()) as {
      data: Record<string, unknown>;
    };

    expect(response.status).toBe(201);
    expect(Object.keys(body.data).sort()).toEqual(
      ['createdAt', 'customerName', 'endsAt', 'id', 'resourceName', 'startsAt'].sort(),
    );
    expect(body.data.customerName).toBe('Ana Pérez');
    expect(body.data.id).toBe(reservationRow.id);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('responde 400 y no consulta persistencia si los datos incumplen el contrato', async () => {
    const query = vi.fn();
    const { baseUrl } = await startApi(query);

    const response = await fetch(`${baseUrl}/api/reservations`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...validRequest, extraField: true }),
    });
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toContain('no está permitido');
    expect(query).not.toHaveBeenCalled();
  });

  it('lista las reservas en el formato documentado por OpenAPI', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [reservationRow] });
    const { baseUrl } = await startApi(query);

    const response = await fetch(`${baseUrl}/api/reservations`);
    const body = (await response.json()) as { data: Array<Record<string, unknown>> };

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].resourceName).toBe('Sala A');
    expect(query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY starts_at ASC, id ASC'));
  });

  it('publica el documento OpenAPI como YAML accesible', async () => {
    const { baseUrl } = await startApi();
    const response = await fetch(`${baseUrl}/openapi.yaml`);
    const document = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/yaml');
    expect(document).toContain('openapi: 3.0.3');
    expect(document).toContain('/api/reservations:');
    expect(document).toContain("'201':");
    expect(document).toContain("'400':");
  });
});
