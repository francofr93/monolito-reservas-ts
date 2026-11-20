import { Router } from 'express';
import { ReservationController } from './ReservationController';

export function createReservationRoutes(controller: ReservationController): Router {
  const router = Router();
  router.get('/reservations', (request, response, next) => {
    void controller.list(request, response, next);
  });
  router.post('/reservations', (request, response, next) => {
    void controller.create(request, response, next);
  });
  return router;
}
