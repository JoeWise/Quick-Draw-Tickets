import { Router } from "express";
import * as eventController from "../controllers/eventController"
import { validateBody } from "../middleware/validateBody";
import { validateQuery } from "../middleware/validateQuery";
import { authenticate } from "../middleware/auth";
import { nearbySchema } from "../schemas/nearbySchema";
import { createEventSchema } from '../schemas/createEventSchema';

const router = Router();

router.get("/nearby", validateQuery(nearbySchema), eventController.getNearbyEvents);
router.get("/:id", eventController.getEventDetails);

router.post("/", validateBody(createEventSchema), authenticate, eventController.createEvent);

export default router;
