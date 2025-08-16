import { Router } from "express";
import * as eventController from "../controllers/eventController"
import { validateBody } from "../middleware/validateBody";
import { validateQuery } from "../middleware/validateQuery";
import { authenticate } from "../middleware/auth";
import { nearbySchema } from "../schemas/nearbySchema";
import { createEventSchema } from '../schemas/createEventSchema';
import { createTicketReservationArraySchema } from "../schemas/createTicketReservation";

const router = Router();

router.get("/nearby", validateQuery(nearbySchema), eventController.getNearbyEvents);
router.get("/:id", eventController.getEventDetails);

router.post("/", validateBody(createEventSchema), authenticate, eventController.createEvent);
router.post("/:id/reserve", validateBody(createTicketReservationArraySchema), authenticate, eventController.reserveTickets);

export default router;
