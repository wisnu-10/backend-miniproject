import { Router } from "express";
import {
    createPromotion,
    updatePromotion,
    deletePromotion,
    getPromotionsByEvent,
} from "../controllers/promotion.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
    createPromotionValidator,
    updatePromotionValidator,
} from "../validators/promotion.validator";

const router = Router();

// Event-specific promotion routes
// Public route - get promotions for an event
router.get("/events/:eventId/promotions", getPromotionsByEvent);

// Protected routes (ORGANIZER only)
router.post(
    "/events/:eventId/promotions",
    authenticate,
    authorize(["ORGANIZER"]),
    createPromotionValidator,
    createPromotion
);
router.put(
    "/events/:eventId/promotions/:id",
    authenticate,
    authorize(["ORGANIZER"]),
    updatePromotionValidator,
    updatePromotion
);
router.delete(
    "/events/:eventId/promotions/:id",
    authenticate,
    authorize(["ORGANIZER"]),
    deletePromotion
);

export default router;
