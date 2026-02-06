import { Router } from "express";
import {
    createPromotion,
    updatePromotion,
    deletePromotion,
    getPromotionsByEvent,
    validatePromotion,
} from "../controllers/promotion.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// Validation route (public)
router.post("/promotions/validate", validatePromotion);

// Event-specific promotion routes
// Public route - get promotions for an event
router.get("/events/:eventId/promotions", getPromotionsByEvent);

// Protected routes (ORGANIZER only)
router.post(
    "/events/:eventId/promotions",
    authenticate,
    authorize(["ORGANIZER"]),
    createPromotion
);
router.put(
    "/events/:eventId/promotions/:id",
    authenticate,
    authorize(["ORGANIZER"]),
    updatePromotion
);
router.delete(
    "/events/:eventId/promotions/:id",
    authenticate,
    authorize(["ORGANIZER"]),
    deletePromotion
);

export default router;
