"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocations = exports.getCategories = exports.getMyEvents = exports.getEventById = exports.getEvents = exports.deleteEvent = exports.updateEvent = exports.createEvent = void 0;
const eventService = __importStar(require("../services/event.service"));
const params_1 = require("../utils/params");
// Create a new event (ORGANIZER only)
const createEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { name, description, category, city, province, start_date, end_date, total_seats, base_price, is_free, image, ticket_types, } = req.body;
        // Validate required fields
        if (!name ||
            !description ||
            !category ||
            !start_date ||
            !end_date ||
            total_seats === undefined ||
            base_price === undefined) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }
        // Validate dates
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            res.status(400).json({ message: "Invalid date format" });
            return;
        }
        if (startDate >= endDate) {
            res.status(400).json({ message: "End date must be after start date" });
            return;
        }
        if (startDate < new Date()) {
            res.status(400).json({ message: "Start date must be in the future" });
            return;
        }
        // Validate numeric fields
        if (total_seats < 1) {
            res.status(400).json({ message: "Total seats must be at least 1" });
            return;
        }
        if (base_price < 0) {
            res.status(400).json({ message: "Base price cannot be negative" });
            return;
        }
        const event = yield eventService.createEvent({
            organizer_id: req.user.id,
            name,
            description,
            category,
            city,
            province,
            start_date: startDate,
            end_date: endDate,
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
    }
    catch (error) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
});
exports.createEvent = createEvent;
// Update an event (owner only)
const updateEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const id = (0, params_1.getParamAsString)(req.params.id);
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
        const event = yield eventService.updateEvent(id, req.user.id, updateData);
        res.status(200).json({
            message: "Event updated successfully",
            data: event,
        });
    }
    catch (error) {
        if (error.message.includes("not found") || error.message.includes("permission")) {
            res.status(404).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
});
exports.updateEvent = updateEvent;
// Delete an event (owner only)
const deleteEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const id = (0, params_1.getParamAsString)(req.params.id);
        yield eventService.deleteEvent(id, req.user.id);
        res.status(200).json({
            message: "Event deleted successfully",
        });
    }
    catch (error) {
        if (error.message.includes("not found") || error.message.includes("permission")) {
            res.status(404).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
});
exports.deleteEvent = deleteEvent;
// Get events list with filters and pagination
const getEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Parse query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const sort_by = req.query.sort_by || "start_date";
        const sort_order = req.query.sort_order || "asc";
        // Validate sort_by
        const validSortFields = ["start_date", "name", "base_price", "created_at"];
        if (!validSortFields.includes(sort_by)) {
            res.status(400).json({
                message: `Invalid sort_by. Must be one of: ${validSortFields.join(", ")}`,
            });
            return;
        }
        // Build filters
        const filters = {};
        if (req.query.search) {
            filters.search = req.query.search;
        }
        if (req.query.category) {
            filters.category = req.query.category;
        }
        if (req.query.city) {
            filters.city = req.query.city;
        }
        if (req.query.province) {
            filters.province = req.query.province;
        }
        if (req.query.is_free !== undefined) {
            filters.is_free = req.query.is_free === "true";
        }
        if (req.query.min_price) {
            filters.min_price = parseFloat(req.query.min_price);
        }
        if (req.query.max_price) {
            filters.max_price = parseFloat(req.query.max_price);
        }
        if (req.query.start_date_from) {
            filters.start_date_from = new Date(req.query.start_date_from);
        }
        if (req.query.start_date_to) {
            filters.start_date_to = new Date(req.query.start_date_to);
        }
        const result = yield eventService.getEvents(filters, {
            page,
            limit,
            sort_by: sort_by,
            sort_order: sort_order,
        });
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
});
exports.getEvents = getEvents;
// Get single event by ID
const getEventById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = (0, params_1.getParamAsString)(req.params.id);
        const event = yield eventService.getEventById(id);
        res.status(200).json({
            data: event,
        });
    }
    catch (error) {
        if (error.message === "Event not found") {
            res.status(404).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
});
exports.getEventById = getEventById;
// Get events by organizer (for organizer dashboard)
const getMyEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const sort_by = req.query.sort_by || "created_at";
        const sort_order = req.query.sort_order || "desc";
        const result = yield eventService.getEventsByOrganizer(req.user.id, {
            page,
            limit,
            sort_by: sort_by,
            sort_order: sort_order,
        });
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
});
exports.getMyEvents = getMyEvents;
// Get categories
const getCategories = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield eventService.getCategories();
        res.status(200).json({
            data: categories,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
});
exports.getCategories = getCategories;
// Get locations
const getLocations = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const locations = yield eventService.getLocations();
        res.status(200).json({
            data: locations,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
});
exports.getLocations = getLocations;
