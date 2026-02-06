"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const promotion_controller_1 = require("../controllers/promotion.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Validation route (public)
router.post("/promotions/validate", promotion_controller_1.validatePromotion);
// Event-specific promotion routes
// Public route - get promotions for an event
router.get("/events/:eventId/promotions", promotion_controller_1.getPromotionsByEvent);
// Protected routes (ORGANIZER only)
router.post("/events/:eventId/promotions", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(["ORGANIZER"]), promotion_controller_1.createPromotion);
router.put("/events/:eventId/promotions/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(["ORGANIZER"]), promotion_controller_1.updatePromotion);
router.delete("/events/:eventId/promotions/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(["ORGANIZER"]), promotion_controller_1.deletePromotion);
exports.default = router;
