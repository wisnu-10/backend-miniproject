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
exports.getTicketTypesByEvent = exports.deleteTicketType = exports.updateTicketType = exports.createTicketType = void 0;
const params_1 = require("../utils/params");
const ticketTypeService = __importStar(require("../services/ticket-type.service"));
// Create a new ticket type
const createTicketType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const eventId = (0, params_1.getParamAsString)(req.params.eventId);
        const { name, description, price, quantity } = req.body;
        // Validate required fields
        if (!name || price === undefined || quantity === undefined) {
            res.status(400).json({ message: "Missing required fields: name, price, quantity" });
            return;
        }
        // Validate numeric fields
        if (price < 0) {
            res.status(400).json({ message: "Price cannot be negative" });
            return;
        }
        if (quantity < 1) {
            res.status(400).json({ message: "Quantity must be at least 1" });
            return;
        }
        const ticketType = yield ticketTypeService.createTicketType(req.user.id, {
            event_id: eventId,
            name,
            description,
            price,
            quantity,
        });
        res.status(201).json({
            message: "Ticket type created successfully",
            data: ticketType,
        });
    }
    catch (error) {
        if (error.message.includes("not found") || error.message.includes("permission")) {
            res.status(404).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
});
exports.createTicketType = createTicketType;
// Update a ticket type
const updateTicketType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const id = (0, params_1.getParamAsString)(req.params.id);
        const updateData = req.body;
        // Validate numeric fields if provided
        if (updateData.price !== undefined && updateData.price < 0) {
            res.status(400).json({ message: "Price cannot be negative" });
            return;
        }
        if (updateData.quantity !== undefined && updateData.quantity < 1) {
            res.status(400).json({ message: "Quantity must be at least 1" });
            return;
        }
        const ticketType = yield ticketTypeService.updateTicketType(id, req.user.id, updateData);
        res.status(200).json({
            message: "Ticket type updated successfully",
            data: ticketType,
        });
    }
    catch (error) {
        if (error.message.includes("not found") || error.message.includes("permission")) {
            res.status(404).json({ message: error.message });
            return;
        }
        if (error.message.includes("Cannot reduce")) {
            res.status(400).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
});
exports.updateTicketType = updateTicketType;
// Delete a ticket type
const deleteTicketType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const id = (0, params_1.getParamAsString)(req.params.id);
        yield ticketTypeService.deleteTicketType(id, req.user.id);
        res.status(200).json({
            message: "Ticket type deleted successfully",
        });
    }
    catch (error) {
        if (error.message.includes("not found") || error.message.includes("permission")) {
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
exports.deleteTicketType = deleteTicketType;
// Get ticket types for an event
const getTicketTypesByEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventId = (0, params_1.getParamAsString)(req.params.eventId);
        const ticketTypes = yield ticketTypeService.getTicketTypesByEvent(eventId);
        res.status(200).json({
            data: ticketTypes,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
});
exports.getTicketTypesByEvent = getTicketTypesByEvent;
