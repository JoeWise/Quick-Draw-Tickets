import { Router } from "express";
import * as venueController from "../controllers/venueController"
import { nearbySchema } from "../schemas/nearbySchema";
import { createVenueSchema } from "../schemas/createVenueSchema";
import { seatingLayoutSchema } from "../schemas/createSeatingLayoutSchema";
import { authenticate } from "../middleware/auth";
import { validateBody } from "../middleware/validateBody";
import { validateQuery } from "../middleware/validateQuery";

const router = Router();

router.get("/nearby", validateQuery(nearbySchema), venueController.getNearbyVenues);
router.get("/:id", venueController.getVenueDetails);

router.post("/", validateBody(createVenueSchema), authenticate, venueController.createVenue);
router.post('/:venueID/seating-layouts', validateBody(seatingLayoutSchema), authenticate, venueController.createSeatingLayout);

export default router;
