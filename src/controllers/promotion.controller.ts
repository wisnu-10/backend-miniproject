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

        // Generate code if not provided
        const promoCode = code || promotionService.generatePromoCode();

        const promotion = await promotionService.createPromotion(req.user.id, {
            event_id: eventId,
            code: promoCode,
            discount_percentage,
            discount_amount,
            max_usage,
            valid_from: new Date(valid_from),
            valid_until: new Date(valid_until),
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

        // Convert date strings to Date objects if provided
        if (updateData.valid_from) {
            updateData.valid_from = new Date(updateData.valid_from);
        }
        if (updateData.valid_until) {
            updateData.valid_until = new Date(updateData.valid_until);
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
