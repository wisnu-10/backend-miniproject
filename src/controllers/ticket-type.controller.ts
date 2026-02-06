import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { getParamAsString } from "../utils/params";
import * as ticketTypeService from "../services/ticket-type.service";

// Create a new ticket type
export const createTicketType = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const eventId = getParamAsString(req.params.eventId);
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

        const ticketType = await ticketTypeService.createTicketType(req.user.id, {
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
    } catch (error: any) {
        if (error.message.includes("not found") || error.message.includes("permission")) {
            res.status(404).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Update a ticket type
export const updateTicketType = async (
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

        // Validate numeric fields if provided
        if (updateData.price !== undefined && updateData.price < 0) {
            res.status(400).json({ message: "Price cannot be negative" });
            return;
        }

        if (updateData.quantity !== undefined && updateData.quantity < 1) {
            res.status(400).json({ message: "Quantity must be at least 1" });
            return;
        }

        const ticketType = await ticketTypeService.updateTicketType(
            id,
            req.user.id,
            updateData
        );

        res.status(200).json({
            message: "Ticket type updated successfully",
            data: ticketType,
        });
    } catch (error: any) {
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
};

// Delete a ticket type
export const deleteTicketType = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const id = getParamAsString(req.params.id);

        await ticketTypeService.deleteTicketType(id, req.user.id);

        res.status(200).json({
            message: "Ticket type deleted successfully",
        });
    } catch (error: any) {
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
};

// Get ticket types for an event
export const getTicketTypesByEvent = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const eventId = getParamAsString(req.params.eventId);

        const ticketTypes = await ticketTypeService.getTicketTypesByEvent(eventId);

        res.status(200).json({
            data: ticketTypes,
        });
    } catch (error: any) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};
