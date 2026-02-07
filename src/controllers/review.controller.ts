import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as reviewService from "../services/review.service";
import { getParamAsString } from "../utils/params";

// Create a new review (CUSTOMER only, must have attended the event)
export const createReview = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { event_id, rating, comment } = req.body;

        // Validate required fields
        if (!event_id || rating === undefined || !comment) {
            res.status(400).json({ message: "Missing required fields: event_id, rating, and comment are required" });
            return;
        }

        // Validate rating
        if (typeof rating !== "number" || rating < 1 || rating > 5) {
            res.status(400).json({ message: "Rating must be a number between 1 and 5" });
            return;
        }

        // Validate comment length
        if (comment.length < 10) {
            res.status(400).json({ message: "Comment must be at least 10 characters long" });
            return;
        }

        const review = await reviewService.createReview({
            user_id: req.user.id,
            event_id,
            rating,
            comment,
        });

        res.status(201).json({
            message: "Review created successfully",
            data: review,
        });
    } catch (error: any) {
        if (
            error.message.includes("only review events") ||
            error.message.includes("already reviewed")
        ) {
            res.status(400).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Update a review (owner only)
export const updateReview = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const id = getParamAsString(req.params.id);
        const { rating, comment } = req.body;

        // Validate rating if provided
        if (rating !== undefined && (typeof rating !== "number" || rating < 1 || rating > 5)) {
            res.status(400).json({ message: "Rating must be a number between 1 and 5" });
            return;
        }

        // Validate comment length if provided
        if (comment !== undefined && comment.length < 10) {
            res.status(400).json({ message: "Comment must be at least 10 characters long" });
            return;
        }

        const review = await reviewService.updateReview(id, req.user.id, {
            rating,
            comment,
        });

        res.status(200).json({
            message: "Review updated successfully",
            data: review,
        });
    } catch (error: any) {
        if (
            error.message.includes("not found") ||
            error.message.includes("permission")
        ) {
            res.status(404).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Delete a review (owner only)
export const deleteReview = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const id = getParamAsString(req.params.id);

        await reviewService.deleteReview(id, req.user.id);

        res.status(200).json({
            message: "Review deleted successfully",
        });
    } catch (error: any) {
        if (
            error.message.includes("not found") ||
            error.message.includes("permission")
        ) {
            res.status(404).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Get reviews for an event (public)
export const getEventReviews = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const eventId = getParamAsString(req.params.eventId);
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
        const sort_by = (req.query.sort_by as string) || "created_at";
        const sort_order = (req.query.sort_order as string) || "desc";

        // Validate sort_by
        const validSortFields = ["created_at", "rating"];
        if (!validSortFields.includes(sort_by)) {
            res.status(400).json({
                message: `Invalid sort_by. Must be one of: ${validSortFields.join(", ")}`,
            });
            return;
        }

        const result = await reviewService.getEventReviews(eventId, {
            page,
            limit,
            sort_by: sort_by as "created_at" | "rating",
            sort_order: sort_order as "asc" | "desc",
        });

        res.status(200).json(result);
    } catch (error: any) {
        if (error.message === "Event not found") {
            res.status(404).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Get event review statistics (public)
export const getEventReviewStats = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const eventId = getParamAsString(req.params.eventId);

        const stats = await reviewService.getEventReviewStats(eventId);

        res.status(200).json({
            data: stats,
        });
    } catch (error: any) {
        if (error.message === "Event not found") {
            res.status(404).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Get organizer profile with reviews (public)
export const getOrganizerReviewProfile = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const organizerId = getParamAsString(req.params.organizerId);

        const profile = await reviewService.getOrganizerReviewProfile(organizerId);

        res.status(200).json({
            data: profile,
        });
    } catch (error: any) {
        if (error.message === "Organizer not found") {
            res.status(404).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Get user's own reviews
export const getMyReviews = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
        const sort_by = (req.query.sort_by as string) || "created_at";
        const sort_order = (req.query.sort_order as string) || "desc";

        const result = await reviewService.getUserReviews(req.user.id, {
            page,
            limit,
            sort_by: sort_by as "created_at" | "rating",
            sort_order: sort_order as "asc" | "desc",
        });

        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Check if user can review an event
export const checkReviewEligibility = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const eventId = getParamAsString(req.params.eventId);

        const eligibility = await reviewService.checkReviewEligibility(
            req.user.id,
            eventId,
        );

        res.status(200).json({
            data: eligibility,
        });
    } catch (error: any) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};
