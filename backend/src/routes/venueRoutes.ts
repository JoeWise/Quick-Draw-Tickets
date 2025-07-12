import { Router } from "express";
import { getVenueDetails, getNearbyVenues } from "../controllers/venueController"
import { validateQuery } from "../middleware/validateQuery";
import { nearbySchema } from "../schemas/nearbySchema";

const router = Router();

router.get("/nearby", validateQuery(nearbySchema), getNearbyVenues);
router.get("/:id", getVenueDetails)

export default router;