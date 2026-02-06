import prisma from "../config/prisma-client.config";
import { Prisma } from "../generated/prisma/client";

// Types for service inputs
export interface CreatePromotionInput {
    event_id: string;
    code: string;
    discount_percentage?: number;
    discount_amount?: number;
    max_usage: number;
    valid_from: Date;
    valid_until: Date;
}

export interface UpdatePromotionInput {
    code?: string;
    discount_percentage?: number;
    discount_amount?: number;
    max_usage?: number;
    valid_from?: Date;
    valid_until?: Date;
}

// Verify event ownership
const verifyEventOwnership = async (eventId: string, organizerId: string) => {
    const event = await prisma.event.findFirst({
        where: {
            id: eventId,
            organizer_id: organizerId,
            deleted_at: null,
        },
    });

    if (!event) {
        throw new Error("Event not found or you don't have permission");
    }

    return event;
};

// Generate unique promo code
export const generatePromoCode = (): string => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const length = 8;
    let result = "PROMO";
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

// Create a new promotion
export const createPromotion = async (
    organizerId: string,
    data: CreatePromotionInput
) => {
    // Verify ownership
    await verifyEventOwnership(data.event_id, organizerId);

    // Validate discount - must have either percentage or amount
    if (!data.discount_percentage && !data.discount_amount) {
        throw new Error("Must provide either discount_percentage or discount_amount");
    }

    // Validate dates
    if (data.valid_from >= data.valid_until) {
        throw new Error("valid_until must be after valid_from");
    }

    // Check for unique code
    const existingCode = await prisma.promotion.findUnique({
        where: { code: data.code },
    });

    if (existingCode) {
        throw new Error("Promotion code already exists");
    }

    const promotion = await prisma.promotion.create({
        data: {
            event_id: data.event_id,
            code: data.code.toUpperCase(),
            discount_percentage: data.discount_percentage
                ? new Prisma.Decimal(data.discount_percentage)
                : null,
            discount_amount: data.discount_amount
                ? new Prisma.Decimal(data.discount_amount)
                : null,
            max_usage: data.max_usage,
            valid_from: data.valid_from,
            valid_until: data.valid_until,
        },
        include: {
            event: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    return promotion;
};

// Update a promotion
export const updatePromotion = async (
    promotionId: string,
    organizerId: string,
    data: UpdatePromotionInput
) => {
    // Get promotion with event
    const existingPromotion = await prisma.promotion.findUnique({
        where: { id: promotionId },
        include: { event: true },
    });

    if (!existingPromotion) {
        throw new Error("Promotion not found");
    }

    // Verify ownership
    await verifyEventOwnership(existingPromotion.event_id, organizerId);

    // Check for unique code if updating
    if (data.code && data.code !== existingPromotion.code) {
        const existingCode = await prisma.promotion.findUnique({
            where: { code: data.code },
        });

        if (existingCode) {
            throw new Error("Promotion code already exists");
        }
    }

    // Validate max_usage can't be less than current_usage
    if (data.max_usage !== undefined && data.max_usage < existingPromotion.current_usage) {
        throw new Error("Cannot reduce max_usage below current usage");
    }

    const promotion = await prisma.promotion.update({
        where: { id: promotionId },
        data: {
            code: data.code?.toUpperCase(),
            discount_percentage: data.discount_percentage !== undefined
                ? new Prisma.Decimal(data.discount_percentage)
                : undefined,
            discount_amount: data.discount_amount !== undefined
                ? new Prisma.Decimal(data.discount_amount)
                : undefined,
            max_usage: data.max_usage,
            valid_from: data.valid_from,
            valid_until: data.valid_until,
        },
        include: {
            event: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    return promotion;
};

// Delete a promotion
export const deletePromotion = async (
    promotionId: string,
    organizerId: string
) => {
    // Get promotion with event
    const existingPromotion = await prisma.promotion.findUnique({
        where: { id: promotionId },
        include: { event: true },
    });

    if (!existingPromotion) {
        throw new Error("Promotion not found");
    }

    // Verify ownership
    await verifyEventOwnership(existingPromotion.event_id, organizerId);

    // Check if promotion has been used
    if (existingPromotion.current_usage > 0) {
        throw new Error("Cannot delete promotion that has been used");
    }

    await prisma.promotion.delete({
        where: { id: promotionId },
    });

    return { success: true };
};

// Get promotions for an event
export const getPromotionsByEvent = async (eventId: string) => {
    const promotions = await prisma.promotion.findMany({
        where: { event_id: eventId },
        orderBy: { created_at: "desc" },
    });

    return promotions;
};

// Validate a promotion code
export const validatePromotion = async (code: string, eventId: string) => {
    const now = new Date();

    const promotion = await prisma.promotion.findFirst({
        where: {
            code: code.toUpperCase(),
            event_id: eventId,
            valid_from: { lte: now },
            valid_until: { gte: now },
        },
        include: {
            event: {
                select: {
                    id: true,
                    name: true,
                    base_price: true,
                },
            },
        },
    });

    if (!promotion) {
        throw new Error("Invalid or expired promotion code");
    }

    if (promotion.current_usage >= promotion.max_usage) {
        throw new Error("Promotion code has reached maximum usage");
    }

    return {
        valid: true,
        promotion: {
            id: promotion.id,
            code: promotion.code,
            discount_percentage: promotion.discount_percentage,
            discount_amount: promotion.discount_amount,
            remaining_usage: promotion.max_usage - promotion.current_usage,
        },
        event: promotion.event,
    };
};

// Get single promotion
export const getPromotionById = async (promotionId: string) => {
    const promotion = await prisma.promotion.findUnique({
        where: { id: promotionId },
        include: {
            event: {
                select: {
                    id: true,
                    name: true,
                    organizer_id: true,
                },
            },
        },
    });

    if (!promotion) {
        throw new Error("Promotion not found");
    }

    return promotion;
};
