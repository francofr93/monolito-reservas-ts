import express, { ErrorRequestHandler } from 'express';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CreateReservationService } from './application/CreateReservationService';
import { ListReservationsService } from './application/ListReservationsService';
import { Pool } from 'pg';
import { PostgresReservationRepository } from './persistence/PostgresReservationRepository';
import { ReservationController } from './presentation/ReservationController';
import { createReservationRoutes } from './presentation/reservationRoutes';

export function createApp(pool: Pool) {
  const app = express();
  const repository = new PostgresReservationRepository(pool);
  const service = new CreateReservationService(repository);
  const listService = new ListReservationsService(repository);
  const controller = new ReservationController(service, listService);

  app.use(express.json());
  app.get('/health', (_request, response) => response.status(200).json({ status: 'ok' }));
  app.get('/openapi.yaml', (_request, response, next) => {
    try {
      const document = readFileSync(resolve(process.cwd(), 'docs', 'openapi.yaml'), 'utf8');
      response.type('application/yaml').send(document);
    } catch (error) {
      next(error);
    }
  });
  app.use('/api', createReservationRoutes(controller));

  const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
    console.error('Error no controlado en la solicitud:', error);
    response.status(500).json({ error: 'Ocurrió un error interno.' });
  };
  app.use(errorHandler);

  return app;
}
