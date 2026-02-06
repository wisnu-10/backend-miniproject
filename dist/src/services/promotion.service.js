"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPromotionById = exports.validatePromotion = exports.getPromotionsByEvent = exports.deletePromotion = exports.updatePromotion = exports.createPromotion = exports.generatePromoCode = void 0;
const prisma_client_config_1 = __importDefault(require("../config/prisma-client.config"));
const client_1 = require("../generated/prisma/client");
// Verify event ownership
const verifyEventOwnership = (eventId, organizerId) => __awaiter(void 0, void 0, void 0, function* () {
    const event = yield prisma_client_config_1.default.event.findFirst({
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
});
// Generate unique promo code
const generatePromoCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const length = 8;
    let result = "PROMO";
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};
exports.generatePromoCode = generatePromoCode;
// Create a new promotion
const createPromotion = (organizerId, data) => __awaiter(void 0, void 0, void 0, function* () {
    // Verify ownership
    yield verifyEventOwnership(data.event_id, organizerId);
    // Validate discount - must have either percentage or amount
    if (!data.discount_percentage && !data.discount_amount) {
        throw new Error("Must provide either discount_percentage or discount_amount");
    }
    // Validate dates
    if (data.valid_from >= data.valid_until) {
        throw new Error("valid_until must be after valid_from");
    }
    // Check for unique code
    const existingCode = yield prisma_client_config_1.default.promotion.findUnique({
        where: { code: data.code },
    });
    if (existingCode) {
        throw new Error("Promotion code already exists");
    }
    const promotion = yield prisma_client_config_1.default.promotion.create({
        data: {
            event_id: data.event_id,
            code: data.code.toUpperCase(),
            discount_percentage: data.discount_percentage
                ? new client_1.Prisma.Decimal(data.discount_percentage)
                : null,
            discount_amount: data.discount_amount
                ? new client_1.Prisma.Decimal(data.discount_amount)
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
});
exports.createPromotion = createPromotion;
// Update a promotion
const updatePromotion = (promotionId, organizerId, data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Get promotion with event
    const existingPromotion = yield prisma_client_config_1.default.promotion.findUnique({
        where: { id: promotionId },
        include: { event: true },
    });
    if (!existingPromotion) {
        throw new Error("Promotion not found");
    }
    // Verify ownership
    yield verifyEventOwnership(existingPromotion.event_id, organizerId);
    // Check for unique code if updating
    if (data.code && data.code !== existingPromotion.code) {
        const existingCode = yield prisma_client_config_1.default.promotion.findUnique({
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
    const promotion = yield prisma_client_config_1.default.promotion.update({
        where: { id: promotionId },
        data: {
            code: (_a = data.code) === null || _a === void 0 ? void 0 : _a.toUpperCase(),
            discount_percentage: data.discount_percentage !== undefined
                ? new client_1.Prisma.Decimal(data.discount_percentage)
                : undefined,
            discount_amount: data.discount_amount !== undefined
                ? new client_1.Prisma.Decimal(data.discount_amount)
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
});
exports.updatePromotion = updatePromotion;
// Delete a promotion
const deletePromotion = (promotionId, organizerId) => __awaiter(void 0, void 0, void 0, function* () {
    // Get promotion with event
    const existingPromotion = yield prisma_client_config_1.default.promotion.findUnique({
        where: { id: promotionId },
        include: { event: true },
    });
    if (!existingPromotion) {
        throw new Error("Promotion not found");
    }
    // Verify ownership
    yield verifyEventOwnership(existingPromotion.event_id, organizerId);
    // Check if promotion has been used
    if (existingPromotion.current_usage > 0) {
        throw new Error("Cannot delete promotion that has been used");
    }
    yield prisma_client_config_1.default.promotion.delete({
        where: { id: promotionId },
    });
    return { success: true };
});
exports.deletePromotion = deletePromotion;
// Get promotions for an event
const getPromotionsByEvent = (eventId) => __awaiter(void 0, void 0, void 0, function* () {
    const promotions = yield prisma_client_config_1.default.promotion.findMany({
        where: { event_id: eventId },
        orderBy: { created_at: "desc" },
    });
    return promotions;
});
exports.getPromotionsByEvent = getPromotionsByEvent;
// Validate a promotion code
const validatePromotion = (code, eventId) => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    const promotion = yield prisma_client_config_1.default.promotion.findFirst({
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
});
exports.validatePromotion = validatePromotion;
// Get single promotion
const getPromotionById = (promotionId) => __awaiter(void 0, void 0, void 0, function* () {
    const promotion = yield prisma_client_config_1.default.promotion.findUnique({
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
});
exports.getPromotionById = getPromotionById;
