import prisma from "../config/prisma-client.config";
import { Prisma } from "../generated/prisma/client";

// Types for service inputs
export interface CreateTicketTypeInput {
    event_id: string;
    name: string;
    description?: string;
    price: number;
    quantity: number;
}

export interface UpdateTicketTypeInput {
    name?: string;
    description?: string;
    price?: number;
    quantity?: number;
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

// Create a new ticket type
export const createTicketType = async (
    organizerId: string,
    data: CreateTicketTypeInput
) => {
    // Verify ownership
    await verifyEventOwnership(data.event_id, organizerId);

    const ticketType = await prisma.ticketType.create({
        data: {
            event_id: data.event_id,
            name: data.name,
            description: data.description,
            price: new Prisma.Decimal(data.price),
            quantity: data.quantity,
            available_quantity: data.quantity,
        },
    });

    return ticketType;
};

// Update a ticket type
export const updateTicketType = async (
    ticketTypeId: string,
    organizerId: string,
    data: UpdateTicketTypeInput
) => {
    // Get ticket type with event
    const existingTicketType = await prisma.ticketType.findUnique({
        where: { id: ticketTypeId },
        include: { event: true },
    });

    if (!existingTicketType) {
        throw new Error("Ticket type not found");
    }

    // Verify ownership
    await verifyEventOwnership(existingTicketType.event_id, organizerId);

    // Calculate available_quantity if quantity changes
    let available_quantity: number | undefined;
    if (data.quantity !== undefined) {
        const soldQuantity = existingTicketType.quantity - existingTicketType.available_quantity;
        available_quantity = data.quantity - soldQuantity;
        if (available_quantity < 0) {
            throw new Error("Cannot reduce quantity below already sold tickets");
        }
    }

    const ticketType = await prisma.ticketType.update({
        where: { id: ticketTypeId },
        data: {
            name: data.name,
            description: data.description,
            price: data.price !== undefined ? new Prisma.Decimal(data.price) : undefined,
            quantity: data.quantity,
            available_quantity,
        },
    });

    return ticketType;
};

// Delete a ticket type
export const deleteTicketType = async (
    ticketTypeId: string,
    organizerId: string
) => {
    // Get ticket type with event
    const existingTicketType = await prisma.ticketType.findUnique({
        where: { id: ticketTypeId },
        include: { event: true },
    });

    if (!existingTicketType) {
        throw new Error("Ticket type not found");
    }

    // Verify ownership
    await verifyEventOwnership(existingTicketType.event_id, organizerId);

    // Check if tickets have been sold
    const soldQuantity = existingTicketType.quantity - existingTicketType.available_quantity;
    if (soldQuantity > 0) {
        throw new Error("Cannot delete ticket type with sold tickets");
    }

    await prisma.ticketType.delete({
        where: { id: ticketTypeId },
    });

    return { success: true };
};

// Get ticket types for an event
export const getTicketTypesByEvent = async (eventId: string) => {
    const ticketTypes = await prisma.ticketType.findMany({
        where: { event_id: eventId },
        orderBy: { price: "asc" },
    });

    return ticketTypes;
};

// Get single ticket type
export const getTicketTypeById = async (ticketTypeId: string) => {
    const ticketType = await prisma.ticketType.findUnique({
        where: { id: ticketTypeId },
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

    if (!ticketType) {
        throw new Error("Ticket type not found");
    }

    return ticketType;
};
