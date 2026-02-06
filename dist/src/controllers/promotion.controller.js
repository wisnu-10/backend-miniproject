"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePromotion = exports.getPromotionsByEvent = exports.deletePromotion = exports.updatePromotion = exports.createPromotion = void 0;
const promotionService = __importStar(require("../services/promotion.service"));
const params_1 = require("../utils/params");
// Create a new promotion
const createPromotion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const eventId = (0, params_1.getParamAsString)(req.params.eventId);
        const { code, discount_percentage, discount_amount, max_usage, valid_from, valid_until, } = req.body;
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
        const promotion = yield promotionService.createPromotion(req.user.id, {
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
    }
    catch (error) {
        if (error.message.includes("not found") ||
            error.message.includes("permission")) {
            res.status(404).json({ message: error.message });
            return;
        }
        if (error.message.includes("already exists") ||
            error.message.includes("Must provide")) {
            res.status(400).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
});
exports.createPromotion = createPromotion;
// Update a promotion
const updatePromotion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const id = (0, params_1.getParamAsString)(req.params.id);
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
        const promotion = yield promotionService.updatePromotion(id, req.user.id, updateData);
        res.status(200).json({
            message: "Promotion updated successfully",
            data: promotion,
        });
    }
    catch (error) {
        if (error.message.includes("not found") ||
            error.message.includes("permission")) {
            res.status(404).json({ message: error.message });
            return;
        }
        if (error.message.includes("already exists") ||
            error.message.includes("Cannot reduce")) {
            res.status(400).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
});
exports.updatePromotion = updatePromotion;
// Delete a promotion
const deletePromotion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const id = (0, params_1.getParamAsString)(req.params.id);
        yield promotionService.deletePromotion(id, req.user.id);
        res.status(200).json({
            message: "Promotion deleted successfully",
        });
    }
    catch (error) {
        if (error.message.includes("not found") ||
            error.message.includes("permission")) {
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
});
exports.deletePromotion = deletePromotion;
// Get promotions for an event
const getPromotionsByEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventId = (0, params_1.getParamAsString)(req.params.eventId);
        const promotions = yield promotionService.getPromotionsByEvent(eventId);
        res.status(200).json({
            data: promotions,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
});
exports.getPromotionsByEvent = getPromotionsByEvent;
// Validate a promotion code
const validatePromotion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { code, event_id } = req.body;
        if (!code || !event_id) {
            res.status(400).json({
                message: "Missing required fields: code, event_id",
            });
            return;
        }
        const result = yield promotionService.validatePromotion(code, event_id);
        res.status(200).json(result);
    }
    catch (error) {
        if (error.message.includes("Invalid") ||
            error.message.includes("expired") ||
            error.message.includes("maximum usage")) {
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
});
exports.validatePromotion = validatePromotion;
