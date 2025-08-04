import { Router } from "express";
import * as venueController from "../controllers/venueController"
import { authenticate } from "../middleware/auth";
import { validateBody } from "../middleware/validateBody";
import { validateQuery } from "../middleware/validateQuery";
import { nearbySchema } from "../schemas/nearbySchema";
import { createVenueSchema } from "../schemas/createVenueSchema";
import { createSeatingLayoutSchema } from "../schemas/createSeatingLayoutSchema";
import { pricingLayoutSchema } from "../schemas/createPricingLayoutSchema";

const router = Router();

router.get("/nearby", validateQuery(nearbySchema), venueController.getNearbyVenues);
router.get("/:id", venueController.getVenueDetails);

router.post("/", validateBody(createVenueSchema), authenticate, venueController.createVenue);
router.post('/:venueID/seating-layouts', validateBody(createSeatingLayoutSchema), authenticate, venueController.createSeatingLayout);
router.post('/:venueID/seating-layouts/:seatingLayoutID/pricing-layouts', validateBody(pricingLayoutSchema), authenticate, venueController.createPricingLayout);

export default router;
