import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as eventService from "../services/event.service";
import { getParamAsString } from "../utils/params";

// Create a new event (ORGANIZER only)
export const createEvent = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const {
      name,
      description,
      category_id,
      city,
      province,
      start_date,
      end_date,
      total_seats,
      base_price,
      is_free,
      image,
      ticket_types,
    } = req.body;

    const event = await eventService.createEvent({
      organizer_id: req.user.id,
      name,
      description,
      category_id,
      city,
      province,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      total_seats,
      base_price,
      is_free,
      image,
      ticket_types,
    });

    res.status(201).json({
      message: "Event created successfully",
      data: event,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update an event (owner only)
export const updateEvent = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const id = getParamAsString(req.params.id);
    const updateData = req.body;

    // Validate dates if provided
    if (updateData.start_date) {
      updateData.start_date = new Date(updateData.start_date);
      if (isNaN(updateData.start_date.getTime())) {
        res.status(400).json({ message: "Invalid start date format" });
        return;
      }
    }

    if (updateData.end_date) {
      updateData.end_date = new Date(updateData.end_date);
      if (isNaN(updateData.end_date.getTime())) {
        res.status(400).json({ message: "Invalid end date format" });
        return;
      }
    }

    const event = await eventService.updateEvent(id, req.user.id, updateData);

    res.status(200).json({
      message: "Event updated successfully",
      data: event,
    });
  } catch (error: any) {
    if (
      error.message.includes("not found") ||
      error.message.includes("permission")
    ) {
      res.status(404).json({ message: error.message });
      return;
    }
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete an event (owner only)
export const deleteEvent = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const id = getParamAsString(req.params.id);

    await eventService.deleteEvent(id, req.user.id);

    res.status(200).json({
      message: "Event deleted successfully",
    });
  } catch (error: any) {
    if (
      error.message.includes("not found") ||
      error.message.includes("permission")
    ) {
      res.status(404).json({ message: error.message });
      return;
    }
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get events list with filters and pagination
export const getEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const sort_by = (req.query.sort_by as string) || "start_date";
    const sort_order = (req.query.sort_order as string) || "asc";

    // Validate sort_by
    const validSortFields = ["start_date", "name", "base_price", "created_at"];
    if (!validSortFields.includes(sort_by)) {
      res.status(400).json({
        message: `Invalid sort_by. Must be one of: ${validSortFields.join(", ")}`,
      });
      return;
    }

    // Build filters
    const filters: eventService.EventFilters = {};

    if (req.query.search) {
      filters.search = req.query.search as string;
    }

    if (req.query.category_id) {
      filters.category_id = req.query.category_id as string;
    }

    if (req.query.city) {
      filters.city = req.query.city as string;
    }

    if (req.query.province) {
      filters.province = req.query.province as string;
    }

    if (req.query.is_free !== undefined) {
      filters.is_free = req.query.is_free === "true";
    }

    if (req.query.min_price) {
      filters.min_price = parseFloat(req.query.min_price as string);
    }

    if (req.query.max_price) {
      filters.max_price = parseFloat(req.query.max_price as string);
    }

    if (req.query.start_date_from) {
      filters.start_date_from = new Date(req.query.start_date_from as string);
    }

    if (req.query.start_date_to) {
      filters.start_date_to = new Date(req.query.start_date_to as string);
    }

    const result = await eventService.getEvents(filters, {
      page,
      limit,
      sort_by: sort_by as "start_date" | "name" | "base_price" | "created_at",
      sort_order: sort_order as "asc" | "desc",
    });

    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get single event by ID
export const getEventById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = getParamAsString(req.params.id);

    const event = await eventService.getEventById(id);

    res.status(200).json({
      data: event,
    });
  } catch (error: any) {
    if (error.message === "Event not found") {
      res.status(404).json({ message: error.message });
      return;
    }
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get events by organizer (for organizer dashboard)
export const getMyEvents = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const sort_by = (req.query.sort_by as string) || "created_at";
    const sort_order = (req.query.sort_order as string) || "desc";

    const result = await eventService.getEventsByOrganizer(req.user.id, {
      page,
      limit,
      sort_by: sort_by as "start_date" | "name" | "base_price" | "created_at",
      sort_order: sort_order as "asc" | "desc",
    });

    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};



// Get locations
export const getLocations = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const locations = await eventService.getLocations();

    res.status(200).json({
      data: locations,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get attendees for an event (ORGANIZER only)
export const getEventAttendees = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const eventId = getParamAsString(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const result = await eventService.getEventAttendees(eventId, req.user.id, {
      page,
      limit,
    });

    res.status(200).json({
      message: "Attendees retrieved successfully",
      ...result,
    });
  } catch (error: any) {
    if (
      error.message.includes("not found") ||
      error.message.includes("permission")
    ) {
      res.status(404).json({ message: error.message });
      return;
    }
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
