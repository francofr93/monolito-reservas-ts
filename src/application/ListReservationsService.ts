import { Reservation } from '../domain/reservation';
import { PostgresReservationRepository } from '../persistence/PostgresReservationRepository';

export class ListReservationsService {
  constructor(private readonly reservations: PostgresReservationRepository) {}

  execute(): Promise<Reservation[]> {
    return this.reservations.findAll();
  }
}
