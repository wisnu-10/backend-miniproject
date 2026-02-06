import { Router } from "express";
import {
    createTicketType,
    updateTicketType,
    deleteTicketType,
    getTicketTypesByEvent,
} from "../controllers/ticket-type.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// Public route - get ticket types for an event
router.get("/:eventId/tickets", getTicketTypesByEvent);

// Protected routes (ORGANIZER only)
router.post(
    "/:eventId/tickets",
    authenticate,
    authorize(["ORGANIZER"]),
    createTicketType
);
router.put(
    "/:eventId/tickets/:id",
    authenticate,
    authorize(["ORGANIZER"]),
    updateTicketType
);
router.delete(
    "/:eventId/tickets/:id",
    authenticate,
    authorize(["ORGANIZER"]),
    deleteTicketType
);

export default router;
