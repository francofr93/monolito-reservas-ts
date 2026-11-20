import { Pool } from 'pg';
import { describe, expect, it, vi } from 'vitest';
import { Reservation } from '../src/domain/reservation';
import { PostgresReservationRepository } from '../src/persistence/PostgresReservationRepository';

describe('PostgresReservationRepository', () => {
  it('parametriza los valores SQL y mapea la fila a Reservation', async () => {
    const startsAt = new Date('2026-11-10T14:00:00-05:00');
    const endsAt = new Date('2026-11-10T15:00:00-05:00');
    const createdAt = new Date('2026-11-01T12:00:00Z');
    const row = {
      id: '5e0057b7-932f-4fd3-83d6-01d43a95ebf8',
      customer_name: 'Ana Pérez',
      resource_name: 'Sala A',
      starts_at: startsAt,
      ends_at: endsAt,
      created_at: createdAt,
    };
    const query = vi.fn().mockResolvedValue({ rows: [row] });
    const pool = { query } as unknown as Pool;
    const repository = new PostgresReservationRepository(pool);
    const reservation: Reservation = {
      id: row.id,
      customerName: row.customer_name,
      resourceName: row.resource_name,
      startsAt,
      endsAt,
      createdAt,
    };

    const result = await repository.create(reservation);

    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('VALUES ($1, $2, $3, $4, $5)'),
      [row.id, row.customer_name, row.resource_name, startsAt, endsAt],
    );
    expect(result).toEqual(reservation);
  });
});
