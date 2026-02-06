"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const event_controller_1 = require("../controllers/event.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public routes
router.get("/meta/categories", event_controller_1.getCategories);
router.get("/meta/locations", event_controller_1.getLocations);
router.get("/", event_controller_1.getEvents);
router.get("/:id", event_controller_1.getEventById);
// Protected routes (ORGANIZER only)
router.post("/", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(["ORGANIZER"]), event_controller_1.createEvent);
router.put("/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(["ORGANIZER"]), event_controller_1.updateEvent);
router.delete("/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(["ORGANIZER"]), event_controller_1.deleteEvent);
// Organizer dashboard route
router.get("/organizer/my-events", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(["ORGANIZER"]), event_controller_1.getMyEvents);
exports.default = router;
