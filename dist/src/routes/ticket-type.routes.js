"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ticket_type_controller_1 = require("../controllers/ticket-type.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public route - get ticket types for an event
router.get("/:eventId/tickets", ticket_type_controller_1.getTicketTypesByEvent);
// Protected routes (ORGANIZER only)
router.post("/:eventId/tickets", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(["ORGANIZER"]), ticket_type_controller_1.createTicketType);
router.put("/:eventId/tickets/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(["ORGANIZER"]), ticket_type_controller_1.updateTicketType);
router.delete("/:eventId/tickets/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(["ORGANIZER"]), ticket_type_controller_1.deleteTicketType);
exports.default = router;
