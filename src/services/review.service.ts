import prisma from "../config/prisma-client.config";
import { TransactionStatus } from "../generated/prisma/client";

// Types for service inputs
export interface CreateReviewInput {
    user_id: string;
    event_id: string;
    rating: number;
    comment: string;
}

export interface UpdateReviewInput {
    rating?: number;
    comment?: string;
}

export interface ReviewFilters {
    event_id?: string;
    user_id?: string;
    min_rating?: number;
    max_rating?: number;
}

export interface PaginationOptions {
    page: number;
    limit: number;
    sort_by?: "created_at" | "rating";
    sort_order?: "asc" | "desc";
}

// Check if user has attended the event (has a completed transaction)
export const hasAttendedEvent = async (
    userId: string,
    eventId: string,
): Promise<boolean> => {
    // Check if user has a completed transaction for this event
    const transaction = await prisma.transaction.findFirst({
        where: {
            user_id: userId,
            event_id: eventId,
            status: TransactionStatus.DONE,
        },
    });

    if (!transaction) {
        return false;
    }

    // Also check if the event has already ended
    const event = await prisma.event.findFirst({
        where: {
            id: eventId,
            end_date: { lt: new Date() }, // Event must have ended
            deleted_at: null,
        },
    });

    return !!event;
};

// Check if user already has a review for this event
export const hasExistingReview = async (
    userId: string,
    eventId: string,
): Promise<boolean> => {
    const review = await prisma.review.findUnique({
        where: {
            user_id_event_id: {
                user_id: userId,
                event_id: eventId,
            },
        },
    });

    return !!review;
};

// Create a new review
export const createReview = async (data: CreateReviewInput) => {
    // Validate rating (1-5)
    if (data.rating < 1 || data.rating > 5) {
        throw new Error("Rating must be between 1 and 5");
    }

    // Check if user has attended the event
    const hasAttended = await hasAttendedEvent(data.user_id, data.event_id);
    if (!hasAttended) {
        throw new Error(
            "You can only review events that you have attended and that have ended",
        );
    }

    // Check if user already has a review
    const hasReview = await hasExistingReview(data.user_id, data.event_id);
    if (hasReview) {
        throw new Error("You have already reviewed this event");
    }

    const review = await prisma.review.create({
        data: {
            user_id: data.user_id,
            event_id: data.event_id,
            rating: data.rating,
            comment: data.comment,
        },
        include: {
            user: {
                select: {
                    id: true,
                    full_name: true,
                    profile_picture: true,
                },
            },
            event: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    return review;
};

// Update an existing review
export const updateReview = async (
    reviewId: string,
    userId: string,
    data: UpdateReviewInput,
) => {
    // Verify ownership
    const existingReview = await prisma.review.findFirst({
        where: {
            id: reviewId,
            user_id: userId,
        },
    });

    if (!existingReview) {
        throw new Error("Review not found or you don't have permission to update");
    }

    // Validate rating if provided
    if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
        throw new Error("Rating must be between 1 and 5");
    }

    const review = await prisma.review.update({
        where: { id: reviewId },
        data: {
            rating: data.rating,
            comment: data.comment,
        },
        include: {
            user: {
                select: {
                    id: true,
                    full_name: true,
                    profile_picture: true,
                },
            },
            event: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    return review;
};

// Delete a review
export const deleteReview = async (reviewId: string, userId: string) => {
    // Verify ownership
    const existingReview = await prisma.review.findFirst({
        where: {
            id: reviewId,
            user_id: userId,
        },
    });

    if (!existingReview) {
        throw new Error("Review not found or you don't have permission to delete");
    }

    await prisma.review.delete({
        where: { id: reviewId },
    });

    return { message: "Review deleted successfully" };
};

// Get reviews for an event with pagination
export const getEventReviews = async (
    eventId: string,
    pagination: PaginationOptions,
) => {
    const {
        page,
        limit,
        sort_by = "created_at",
        sort_order = "desc",
    } = pagination;
    const skip = (page - 1) * limit;

    // Verify event exists
    const event = await prisma.event.findFirst({
        where: {
            id: eventId,
            deleted_at: null,
        },
    });

    if (!event) {
        throw new Error("Event not found");
    }

    const [reviews, total] = await Promise.all([
        prisma.review.findMany({
            where: { event_id: eventId },
            skip,
            take: limit,
            orderBy: { [sort_by]: sort_order },
            include: {
                user: {
                    select: {
                        id: true,
                        full_name: true,
                        profile_picture: true,
                    },
                },
            },
        }),
        prisma.review.count({ where: { event_id: eventId } }),
    ]);

    // Calculate average rating
    const ratingStats = await prisma.review.aggregate({
        where: { event_id: eventId },
        _avg: { rating: true },
        _count: { rating: true },
    });

    return {
        data: reviews,
        stats: {
            average_rating: ratingStats._avg.rating || 0,
            total_reviews: ratingStats._count.rating,
        },
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

// Get event review statistics
export const getEventReviewStats = async (eventId: string) => {
    // Verify event exists
    const event = await prisma.event.findFirst({
        where: {
            id: eventId,
            deleted_at: null,
        },
    });

    if (!event) {
        throw new Error("Event not found");
    }

    // Get rating distribution
    const ratingDistribution = await prisma.review.groupBy({
        by: ["rating"],
        where: { event_id: eventId },
        _count: { rating: true },
        orderBy: { rating: "desc" },
    });

    // Get average and total
    const stats = await prisma.review.aggregate({
        where: { event_id: eventId },
        _avg: { rating: true },
        _count: { rating: true },
    });

    // Format distribution (ensure all ratings 1-5 are present)
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDistribution.forEach((r) => {
        distribution[r.rating] = r._count.rating;
    });

    return {
        average_rating: stats._avg.rating || 0,
        total_reviews: stats._count.rating,
        rating_distribution: distribution,
    };
};

// Get organizer profile with reviews and ratings
export const getOrganizerReviewProfile = async (organizerId: string) => {
    // Get organizer info
    const organizer = await prisma.user.findFirst({
        where: {
            id: organizerId,
            role: "ORGANIZER",
            deleted_at: null,
        },
        select: {
            id: true,
            full_name: true,
            profile_picture: true,
            email: true,
            created_at: true,
        },
    });

    if (!organizer) {
        throw new Error("Organizer not found");
    }

    // Get all events by organizer
    const events = await prisma.event.findMany({
        where: {
            organizer_id: organizerId,
            deleted_at: null,
        },
        select: {
            id: true,
        },
    });

    const eventIds = events.map((e) => e.id);

    // Get aggregate review stats across all events
    const reviewStats = await prisma.review.aggregate({
        where: {
            event_id: { in: eventIds },
        },
        _avg: { rating: true },
        _count: { rating: true },
    });

    // Get recent reviews for organizer's events
    const recentReviews = await prisma.review.findMany({
        where: {
            event_id: { in: eventIds },
        },
        take: 10,
        orderBy: { created_at: "desc" },
        include: {
            user: {
                select: {
                    id: true,
                    full_name: true,
                    profile_picture: true,
                },
            },
            event: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    // Get rating distribution
    const ratingDistribution = await prisma.review.groupBy({
        by: ["rating"],
        where: { event_id: { in: eventIds } },
        _count: { rating: true },
        orderBy: { rating: "desc" },
    });

    // Format distribution
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDistribution.forEach((r) => {
        distribution[r.rating] = r._count.rating;
    });

    // Get event count
    const eventCount = await prisma.event.count({
        where: {
            organizer_id: organizerId,
            deleted_at: null,
        },
    });

    return {
        organizer: {
            ...organizer,
            total_events: eventCount,
        },
        review_summary: {
            average_rating: reviewStats._avg.rating || 0,
            total_reviews: reviewStats._count.rating,
            rating_distribution: distribution,
        },
        recent_reviews: recentReviews,
    };
};

// Get user's own reviews
export const getUserReviews = async (
    userId: string,
    pagination: PaginationOptions,
) => {
    const {
        page,
        limit,
        sort_by = "created_at",
        sort_order = "desc",
    } = pagination;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
        prisma.review.findMany({
            where: { user_id: userId },
            skip,
            take: limit,
            orderBy: { [sort_by]: sort_order },
            include: {
                event: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        start_date: true,
                        end_date: true,
                    },
                },
            },
        }),
        prisma.review.count({ where: { user_id: userId } }),
    ]);

    return {
        data: reviews,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

// Check if user can review an event
export const checkReviewEligibility = async (
    userId: string,
    eventId: string,
) => {
    const hasAttended = await hasAttendedEvent(userId, eventId);
    const hasReview = await hasExistingReview(userId, eventId);

    return {
        can_review: hasAttended && !hasReview,
        has_attended: hasAttended,
        has_existing_review: hasReview,
    };
};
