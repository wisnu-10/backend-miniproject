import { Router } from "express";
import {
    createEvent,
    updateEvent,
    deleteEvent,
    getEvents,
    getEventById,
    getMyEvents,
    getCategories,
    getLocations,
} from "../controllers/event.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// Public routes
router.get("/meta/categories", getCategories);
router.get("/meta/locations", getLocations);
router.get("/", getEvents);
router.get("/:id", getEventById);

// Protected routes (ORGANIZER only)
router.post("/", authenticate, authorize(["ORGANIZER"]), createEvent);
router.put("/:id", authenticate, authorize(["ORGANIZER"]), updateEvent);
router.delete("/:id", authenticate, authorize(["ORGANIZER"]), deleteEvent);

// Organizer dashboard route
router.get(
    "/organizer/my-events",
    authenticate,
    authorize(["ORGANIZER"]),
    getMyEvents
);

export default router;
