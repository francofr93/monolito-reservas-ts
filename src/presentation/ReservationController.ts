import { NextFunction, Request, Response } from 'express';
import { CreateReservationService, InvalidReservationError } from '../application/CreateReservationService';
import { ListReservationsService } from '../application/ListReservationsService';

export class ReservationController {
  constructor(
    private readonly createReservation: CreateReservationService,
    private readonly listReservations: ListReservationsService,
  ) {}

  create = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const reservation = await this.createReservation.execute(request.body ?? {});
      response.status(201).json({ data: reservation });
    } catch (error) {
      if (error instanceof InvalidReservationError) {
        response.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  };

  list = async (_request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const reservations = await this.listReservations.execute();
      response.status(200).json({ data: reservations });
    } catch (error) {
      next(error);
    }
  };
}
