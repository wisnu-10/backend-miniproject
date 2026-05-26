import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as reviewService from "../services/review.service";
import { getParamAsString } from "../utils/params";
import { BadRequestError } from "../utils/errors";

// Create a new review (CUSTOMER only, must have attended the event)
export const createReview = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    const { event_id, rating, comment } = req.body;

    // Validate required fields
    if (!event_id || rating === undefined || !comment) {
        throw new BadRequestError("Missing required fields: event_id, rating, and comment are required");
    }

    // Validate rating
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
        throw new BadRequestError("Rating must be a number between 1 and 5");
    }

    // Validate comment length
    if (comment.length < 10) {
        throw new BadRequestError("Comment must be at least 10 characters long");
    }

    const review = await reviewService.createReview({
        user_id: req.user!.id,
        event_id,
        rating,
        comment,
    });

    res.status(201).json({
        message: "Review created successfully",
        data: review,
    });
};

// Update a review (owner only)
export const updateReview = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    const id = getParamAsString(req.params.id);
    const { rating, comment } = req.body;

    // Validate rating if provided
    if (rating !== undefined && (typeof rating !== "number" || rating < 1 || rating > 5)) {
        throw new BadRequestError("Rating must be a number between 1 and 5");
    }

    // Validate comment length if provided
    if (comment !== undefined && comment.length < 10) {
        throw new BadRequestError("Comment must be at least 10 characters long");
    }

    const review = await reviewService.updateReview(id, req.user!.id, {
        rating,
        comment,
    });

    res.status(200).json({
        message: "Review updated successfully",
        data: review,
    });
};

// Delete a review (owner only)
export const deleteReview = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    const id = getParamAsString(req.params.id);

    await reviewService.deleteReview(id, req.user!.id);

    res.status(200).json({
        message: "Review deleted successfully",
    });
};

// Get reviews for an event (public)
export const getEventReviews = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const eventId = getParamAsString(req.params.eventId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const sort_by = (req.query.sort_by as string) || "created_at";
    const sort_order = (req.query.sort_order as string) || "desc";

    // Validate sort_by
    const validSortFields = ["created_at", "rating"];
    if (!validSortFields.includes(sort_by)) {
        throw new BadRequestError(`Invalid sort_by. Must be one of: ${validSortFields.join(", ")}`);
    }

    const result = await reviewService.getEventReviews(eventId, {
        page,
        limit,
        sort_by: sort_by as "created_at" | "rating",
        sort_order: sort_order as "asc" | "desc",
    });

    res.status(200).json(result);
};

// Get event review statistics (public)
export const getEventReviewStats = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const eventId = getParamAsString(req.params.eventId);

    const stats = await reviewService.getEventReviewStats(eventId);

    res.status(200).json({
        data: stats,
    });
};

// Get organizer profile with reviews (public)
export const getOrganizerReviewProfile = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const organizerId = getParamAsString(req.params.organizerId);

    const profile = await reviewService.getOrganizerReviewProfile(organizerId);

    res.status(200).json({
        data: profile,
    });
};

// Get user's own reviews
export const getMyReviews = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const sort_by = (req.query.sort_by as string) || "created_at";
    const sort_order = (req.query.sort_order as string) || "desc";

    const result = await reviewService.getUserReviews(req.user!.id, {
        page,
        limit,
        sort_by: sort_by as "created_at" | "rating",
        sort_order: sort_order as "asc" | "desc",
    });

    res.status(200).json(result);
};

// Check if user can review an event
export const checkReviewEligibility = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    const eventId = getParamAsString(req.params.eventId);

    const eligibility = await reviewService.checkReviewEligibility(
        req.user!.id,
        eventId,
    );

    res.status(200).json({
        data: eligibility,
    });
};
