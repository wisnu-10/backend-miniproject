import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { getParamAsString } from "../utils/params";
import * as ticketTypeService from "../services/ticket-type.service";
import { BadRequestError } from "../utils/errors";

// Create a new ticket type
export const createTicketType = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    const eventId = getParamAsString(req.params.eventId);
    const { name, description, price, quantity } = req.body;

    // Validate required fields
    if (!name || price === undefined || quantity === undefined) {
        throw new BadRequestError("Missing required fields: name, price, quantity");
    }

    // Validate numeric fields
    if (price < 0) {
        throw new BadRequestError("Price cannot be negative");
    }

    if (quantity < 1) {
        throw new BadRequestError("Quantity must be at least 1");
    }

    const ticketType = await ticketTypeService.createTicketType(req.user!.id, {
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
};

// Update a ticket type
export const updateTicketType = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    const id = getParamAsString(req.params.id);
    const updateData = req.body;

    // Validate numeric fields if provided
    if (updateData.price !== undefined && updateData.price < 0) {
        throw new BadRequestError("Price cannot be negative");
    }

    if (updateData.quantity !== undefined && updateData.quantity < 1) {
        throw new BadRequestError("Quantity must be at least 1");
    }

    const ticketType = await ticketTypeService.updateTicketType(
        id,
        req.user!.id,
        updateData
    );

    res.status(200).json({
        message: "Ticket type updated successfully",
        data: ticketType,
    });
};

// Delete a ticket type
export const deleteTicketType = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    const id = getParamAsString(req.params.id);

    await ticketTypeService.deleteTicketType(id, req.user!.id);

    res.status(200).json({
        message: "Ticket type deleted successfully",
    });
};

// Get ticket types for an event
export const getTicketTypesByEvent = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    const eventId = getParamAsString(req.params.eventId);

    const ticketTypes = await ticketTypeService.getTicketTypesByEvent(eventId);

    res.status(200).json({
        data: ticketTypes,
    });
};
