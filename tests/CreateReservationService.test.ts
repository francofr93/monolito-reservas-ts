import { Pool } from 'pg';
import { describe, expect, it, vi } from 'vitest';
import {
  CreateReservationService,
  InvalidReservationError,
} from '../src/application/CreateReservationService';
import { CreateReservationInput } from '../src/domain/reservation';
import { PostgresReservationRepository } from '../src/persistence/PostgresReservationRepository';

const validInput: CreateReservationInput = {
  customerName: ' Ana Pérez ',
  resourceName: ' Sala A ',
  startsAt: '2026-11-10T14:00:00-05:00',
  endsAt: '2026-11-10T15:00:00-05:00',
};

function setup() {
  const pool = { query: vi.fn() } as unknown as Pool;
  const repository = new PostgresReservationRepository(pool);
  const createReservation = vi
    .spyOn(repository, 'create')
    .mockImplementation(async (reservation) => reservation);
  const service = new CreateReservationService(repository);
  return { service, createReservation };
}

describe('CreateReservationService', () => {
  it('normaliza los textos y envía la reserva válida al repositorio', async () => {
    const { service, createReservation } = setup();
    const result = await service.execute(validInput);

    expect(result.customerName).toBe('Ana Pérez');
    expect(result.resourceName).toBe('Sala A');
    expect(result.startsAt).toEqual(new Date('2026-11-10T14:00:00-05:00'));
    expect(result.endsAt).toEqual(new Date('2026-11-10T15:00:00-05:00'));
    expect(result.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(createReservation).toHaveBeenCalledTimes(1);
  });

  it('rechaza el nombre del cliente vacío y no llama al repositorio', async () => {
    const { service, createReservation } = setup();

    await expect(
      service.execute({ ...validInput, customerName: '   ' }),
    ).rejects.toBeInstanceOf(InvalidReservationError);

    expect(createReservation).not.toHaveBeenCalled();
  });

  it('rechaza un recurso cuyo nombre excede el máximo permitido', async () => {
    const { service, createReservation } = setup();

    await expect(
      service.execute({ ...validInput, resourceName: 'R'.repeat(161) }),
    ).rejects.toThrow('resourceName no puede superar 160 caracteres.');

    expect(createReservation).not.toHaveBeenCalled();
  });

  it('rechaza una fecha que no usa el formato ISO esperado', async () => {
    const { service, createReservation } = setup();

    await expect(
      service.execute({ ...validInput, startsAt: '10/11/2026 14:00' }),
    ).rejects.toThrow('startsAt debe ser una fecha ISO válida.');

    expect(createReservation).not.toHaveBeenCalled();
  });

  it('rechaza cuando la fecha final es igual a la inicial', async () => {
    const { service, createReservation } = setup();

    await expect(
      service.execute({ ...validInput, endsAt: validInput.startsAt }),
    ).rejects.toThrow('endsAt debe ser posterior a startsAt.');

    expect(createReservation).not.toHaveBeenCalled();
  });

  it('rechaza cuando la fecha final precede a la inicial', async () => {
    const { service, createReservation } = setup();

    await expect(
      service.execute({
        ...validInput,
        startsAt: '2026-11-10T15:00:00-05:00',
        endsAt: '2026-11-10T14:00:00-05:00',
      }),
    ).rejects.toThrow('endsAt debe ser posterior a startsAt.');

    expect(createReservation).not.toHaveBeenCalled();
  });
});
