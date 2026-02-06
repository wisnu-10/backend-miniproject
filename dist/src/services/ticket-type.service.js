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
exports.getTicketTypeById = exports.getTicketTypesByEvent = exports.deleteTicketType = exports.updateTicketType = exports.createTicketType = void 0;
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
// Create a new ticket type
const createTicketType = (organizerId, data) => __awaiter(void 0, void 0, void 0, function* () {
    // Verify ownership
    yield verifyEventOwnership(data.event_id, organizerId);
    const ticketType = yield prisma_client_config_1.default.ticketType.create({
        data: {
            event_id: data.event_id,
            name: data.name,
            description: data.description,
            price: new client_1.Prisma.Decimal(data.price),
            quantity: data.quantity,
            available_quantity: data.quantity,
        },
    });
    return ticketType;
});
exports.createTicketType = createTicketType;
// Update a ticket type
const updateTicketType = (ticketTypeId, organizerId, data) => __awaiter(void 0, void 0, void 0, function* () {
    // Get ticket type with event
    const existingTicketType = yield prisma_client_config_1.default.ticketType.findUnique({
        where: { id: ticketTypeId },
        include: { event: true },
    });
    if (!existingTicketType) {
        throw new Error("Ticket type not found");
    }
    // Verify ownership
    yield verifyEventOwnership(existingTicketType.event_id, organizerId);
    // Calculate available_quantity if quantity changes
    let available_quantity;
    if (data.quantity !== undefined) {
        const soldQuantity = existingTicketType.quantity - existingTicketType.available_quantity;
        available_quantity = data.quantity - soldQuantity;
        if (available_quantity < 0) {
            throw new Error("Cannot reduce quantity below already sold tickets");
        }
    }
    const ticketType = yield prisma_client_config_1.default.ticketType.update({
        where: { id: ticketTypeId },
        data: {
            name: data.name,
            description: data.description,
            price: data.price !== undefined ? new client_1.Prisma.Decimal(data.price) : undefined,
            quantity: data.quantity,
            available_quantity,
        },
    });
    return ticketType;
});
exports.updateTicketType = updateTicketType;
// Delete a ticket type
const deleteTicketType = (ticketTypeId, organizerId) => __awaiter(void 0, void 0, void 0, function* () {
    // Get ticket type with event
    const existingTicketType = yield prisma_client_config_1.default.ticketType.findUnique({
        where: { id: ticketTypeId },
        include: { event: true },
    });
    if (!existingTicketType) {
        throw new Error("Ticket type not found");
    }
    // Verify ownership
    yield verifyEventOwnership(existingTicketType.event_id, organizerId);
    // Check if tickets have been sold
    const soldQuantity = existingTicketType.quantity - existingTicketType.available_quantity;
    if (soldQuantity > 0) {
        throw new Error("Cannot delete ticket type with sold tickets");
    }
    yield prisma_client_config_1.default.ticketType.delete({
        where: { id: ticketTypeId },
    });
    return { success: true };
});
exports.deleteTicketType = deleteTicketType;
// Get ticket types for an event
const getTicketTypesByEvent = (eventId) => __awaiter(void 0, void 0, void 0, function* () {
    const ticketTypes = yield prisma_client_config_1.default.ticketType.findMany({
        where: { event_id: eventId },
        orderBy: { price: "asc" },
    });
    return ticketTypes;
});
exports.getTicketTypesByEvent = getTicketTypesByEvent;
// Get single ticket type
const getTicketTypeById = (ticketTypeId) => __awaiter(void 0, void 0, void 0, function* () {
    const ticketType = yield prisma_client_config_1.default.ticketType.findUnique({
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
});
exports.getTicketTypeById = getTicketTypeById;
