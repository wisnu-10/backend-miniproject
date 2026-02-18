import { Router } from "express";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getEvents,
  getEventById,
  getMyEvents,
  getLocations,
  getEventAttendees,
} from "../controllers/event.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  createEventValidator,
  handleValidationErrors,
} from "../validators/event.validator";

const router = Router();

// Public routes - static paths MUST come before /:id
router.get("/meta/locations", getLocations);

// Organizer dashboard route - MUST come before /:id to avoid being caught
router.get(
  "/organizer/my-events",
  authenticate,
  authorize(["ORGANIZER"]),
  getMyEvents,
);

// Public list and detail
router.get("/", getEvents);
router.get("/:id", getEventById);

// Protected routes (ORGANIZER only)
router.post(
  "/",
  authenticate,
  authorize(["ORGANIZER"]),
  createEventValidator,
  handleValidationErrors,
  createEvent,
);
router.put("/:id", authenticate, authorize(["ORGANIZER"]), updateEvent);
router.delete("/:id", authenticate, authorize(["ORGANIZER"]), deleteEvent);

// Attendee list for an event (ORGANIZER only)
router.get(
  "/:id/attendees",
  authenticate,
  authorize(["ORGANIZER"]),
  getEventAttendees,
);

export default router;
