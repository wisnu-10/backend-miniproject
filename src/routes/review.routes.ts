import { Router } from "express";
import {
    createReview,
    updateReview,
    deleteReview,
    getEventReviews,
    getEventReviewStats,
    getOrganizerReviewProfile,
    getMyReviews,
    checkReviewEligibility,
} from "../controllers/review.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// Public routes
// Get reviews for an event
router.get("/events/:eventId/reviews", getEventReviews);

// Get review statistics for an event
router.get("/events/:eventId/reviews/stats", getEventReviewStats);

// Get organizer profile with reviews
router.get("/organizers/:organizerId/reviews", getOrganizerReviewProfile);

// Protected routes (CUSTOMER only)
// Create a review (must have attended the event)
router.post(
    "/reviews",
    authenticate,
    authorize(["CUSTOMER"]),
    createReview,
);

// Update own review
router.put(
    "/reviews/:id",
    authenticate,
    authorize(["CUSTOMER"]),
    updateReview,
);

// Delete own review
router.delete(
    "/reviews/:id",
    authenticate,
    authorize(["CUSTOMER"]),
    deleteReview,
);

// Get user's own reviews
router.get(
    "/users/me/reviews",
    authenticate,
    authorize(["CUSTOMER"]),
    getMyReviews,
);

// Check if user can review an event
router.get(
    "/events/:eventId/reviews/eligibility",
    authenticate,
    authorize(["CUSTOMER"]),
    checkReviewEligibility,
);

export default router;
