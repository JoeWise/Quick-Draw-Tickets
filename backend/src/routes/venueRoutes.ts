import { Router } from "express";
import { getNearbyVenues } from "../controllers/venueController"
import { validateQuery } from "../middleware/validateQuery";
import { nearbySchema } from "../schemas/nearbySchema";

const router = Router();

router.get("/nearby", validateQuery(nearbySchema), getNearbyVenues);

export default router;