import { Router } from "express";
import { getVenueDetails, getNearbyVenues, createVenue } from "../controllers/venueController"
import { nearbySchema } from "../schemas/nearbySchema";
import { createVenueSchema } from "../schemas/createVenueSchema";
import { authenticate } from "../middleware/auth";
import { validateBody } from "../middleware/validateBody";
import { validateQuery } from "../middleware/validateQuery";

const router = Router();

router.get("/nearby", validateQuery(nearbySchema), getNearbyVenues);
router.get("/:id", getVenueDetails);

router.post("/", validateBody(createVenueSchema), authenticate, createVenue);

export default router;