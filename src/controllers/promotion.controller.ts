import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as promotionService from "../services/promotion.service";
import { getParamAsString } from "../utils/params";

// Create a new promotion
export const createPromotion = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const eventId = getParamAsString(req.params.eventId);
        const {
            code,
            discount_percentage,
            discount_amount,
            max_usage,
            valid_from,
            valid_until,
        } = req.body;

        // Validate required fields
        if (!max_usage || !valid_from || !valid_until) {
            res.status(400).json({
                message: "Missing required fields: max_usage, valid_from, valid_until",
            });
            return;
        }

        // Generate code if not provided
        const promoCode = code || promotionService.generatePromoCode();

        // Validate dates
        const validFromDate = new Date(valid_from);
        const validUntilDate = new Date(valid_until);

        if (isNaN(validFromDate.getTime()) || isNaN(validUntilDate.getTime())) {
            res.status(400).json({ message: "Invalid date format" });
            return;
        }

        // Validate discount values
        if (!discount_percentage && !discount_amount) {
            res.status(400).json({
                message: "Must provide either discount_percentage or discount_amount",
            });
            return;
        }

        if (discount_percentage !== undefined) {
            if (discount_percentage <= 0 || discount_percentage > 100) {
                res.status(400).json({
                    message: "Discount percentage must be between 0 and 100",
                });
                return;
            }
        }

        if (discount_amount !== undefined && discount_amount <= 0) {
            res.status(400).json({
                message: "Discount amount must be greater than 0",
            });
            return;
        }

        if (max_usage < 1) {
            res.status(400).json({ message: "Max usage must be at least 1" });
            return;
        }

        const promotion = await promotionService.createPromotion(req.user.id, {
            event_id: eventId,
            code: promoCode,
            discount_percentage,
            discount_amount,
            max_usage,
            valid_from: validFromDate,
            valid_until: validUntilDate,
        });

        res.status(201).json({
            message: "Promotion created successfully",
            data: promotion,
        });
    } catch (error: any) {
        if (
            error.message.includes("not found") ||
            error.message.includes("permission")
        ) {
            res.status(404).json({ message: error.message });
            return;
        }
        if (
            error.message.includes("already exists") ||
            error.message.includes("Must provide")
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

// Update a promotion
export const updatePromotion = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const id = getParamAsString(req.params.id);
        const updateData = req.body;

        // Validate dates if provided
        if (updateData.valid_from) {
            updateData.valid_from = new Date(updateData.valid_from);
            if (isNaN(updateData.valid_from.getTime())) {
                res.status(400).json({ message: "Invalid valid_from date format" });
                return;
            }
        }

        if (updateData.valid_until) {
            updateData.valid_until = new Date(updateData.valid_until);
            if (isNaN(updateData.valid_until.getTime())) {
                res.status(400).json({ message: "Invalid valid_until date format" });
                return;
            }
        }

        // Validate discount percentage if provided
        if (updateData.discount_percentage !== undefined) {
            if (updateData.discount_percentage <= 0 || updateData.discount_percentage > 100) {
                res.status(400).json({
                    message: "Discount percentage must be between 0 and 100",
                });
                return;
            }
        }

        const promotion = await promotionService.updatePromotion(
            id,
            req.user.id,
            updateData
        );

        res.status(200).json({
            message: "Promotion updated successfully",
            data: promotion,
        });
    } catch (error: any) {
        if (
            error.message.includes("not found") ||
            error.message.includes("permission")
        ) {
            res.status(404).json({ message: error.message });
            return;
        }
        if (
            error.message.includes("already exists") ||
            error.message.includes("Cannot reduce")
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

// Delete a promotion
export const deletePromotion = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const id = getParamAsString(req.params.id);

        await promotionService.deletePromotion(id, req.user.id);

        res.status(200).json({
            message: "Promotion deleted successfully",
        });
    } catch (error: any) {
        if (
            error.message.includes("not found") ||
            error.message.includes("permission")
        ) {
            res.status(404).json({ message: error.message });
            return;
        }
        if (error.message.includes("Cannot delete")) {
            res.status(400).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Get promotions for an event
export const getPromotionsByEvent = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const eventId = getParamAsString(req.params.eventId);

        const promotions = await promotionService.getPromotionsByEvent(eventId);

        res.status(200).json({
            data: promotions,
        });
    } catch (error: any) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Validate a promotion code
export const validatePromotion = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { code, event_id } = req.body;

        if (!code || !event_id) {
            res.status(400).json({
                message: "Missing required fields: code, event_id",
            });
            return;
        }

        const result = await promotionService.validatePromotion(code, event_id);

        res.status(200).json(result);
    } catch (error: any) {
        if (
            error.message.includes("Invalid") ||
            error.message.includes("expired") ||
            error.message.includes("maximum usage")
        ) {
            res.status(400).json({
                valid: false,
                message: error.message,
            });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};
