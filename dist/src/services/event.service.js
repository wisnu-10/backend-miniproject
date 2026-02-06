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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocations = exports.getCategories = exports.getEventsByOrganizer = exports.getEventById = exports.getEvents = exports.deleteEvent = exports.updateEvent = exports.createEvent = void 0;
const prisma_client_config_1 = __importDefault(require("../config/prisma-client.config"));
const client_1 = require("../generated/prisma/client");
// Create a new event with optional ticket types
const createEvent = (data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { ticket_types } = data, eventData = __rest(data, ["ticket_types"]);
    // Determine if event is free based on base_price
    const is_free = (_a = data.is_free) !== null && _a !== void 0 ? _a : data.base_price === 0;
    const event = yield prisma_client_config_1.default.event.create({
        data: Object.assign(Object.assign({}, eventData), { is_free, available_seats: eventData.total_seats, base_price: new client_1.Prisma.Decimal(eventData.base_price), ticket_types: ticket_types
                ? {
                    create: ticket_types.map((tt) => ({
                        name: tt.name,
                        description: tt.description,
                        price: new client_1.Prisma.Decimal(tt.price),
                        quantity: tt.quantity,
                        available_quantity: tt.quantity,
                    })),
                }
                : undefined }),
        include: {
            ticket_types: true,
            organizer: {
                select: {
                    id: true,
                    full_name: true,
                    email: true,
                },
            },
        },
    });
    return event;
});
exports.createEvent = createEvent;
// Update an existing event
const updateEvent = (eventId, organizerId, data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Verify ownership
    const existingEvent = yield prisma_client_config_1.default.event.findFirst({
        where: {
            id: eventId,
            organizer_id: organizerId,
            deleted_at: null,
        },
    });
    if (!existingEvent) {
        throw new Error("Event not found or you don't have permission to update");
    }
    // Update is_free if base_price is updated
    const is_free = data.base_price !== undefined
        ? (_a = data.is_free) !== null && _a !== void 0 ? _a : data.base_price === 0
        : data.is_free;
    // Calculate available_seats if total_seats changes
    let available_seats;
    if (data.total_seats !== undefined) {
        const seatsDiff = data.total_seats - existingEvent.total_seats;
        available_seats = existingEvent.available_seats + seatsDiff;
        if (available_seats < 0) {
            throw new Error("Cannot reduce total seats below already sold tickets");
        }
    }
    const event = yield prisma_client_config_1.default.event.update({
        where: { id: eventId },
        data: Object.assign(Object.assign({}, data), { is_free,
            available_seats, base_price: data.base_price !== undefined
                ? new client_1.Prisma.Decimal(data.base_price)
                : undefined }),
        include: {
            ticket_types: true,
            organizer: {
                select: {
                    id: true,
                    full_name: true,
                    email: true,
                },
            },
        },
    });
    return event;
});
exports.updateEvent = updateEvent;
// Soft delete an event
const deleteEvent = (eventId, organizerId) => __awaiter(void 0, void 0, void 0, function* () {
    // Verify ownership
    const existingEvent = yield prisma_client_config_1.default.event.findFirst({
        where: {
            id: eventId,
            organizer_id: organizerId,
            deleted_at: null,
        },
    });
    if (!existingEvent) {
        throw new Error("Event not found or you don't have permission to delete");
    }
    const event = yield prisma_client_config_1.default.event.update({
        where: { id: eventId },
        data: {
            deleted_at: new Date(),
        },
    });
    return event;
});
exports.deleteEvent = deleteEvent;
// Get events with filters, search, sorting, and pagination
const getEvents = (filters, pagination) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, sort_by = "start_date", sort_order = "asc" } = pagination;
    const skip = (page - 1) * limit;
    // Build where clause
    const where = {
        deleted_at: null,
    };
    // Search in name and description
    if (filters.search) {
        where.OR = [
            { name: { contains: filters.search, mode: "insensitive" } },
            { description: { contains: filters.search, mode: "insensitive" } },
        ];
    }
    // Category filter
    if (filters.category) {
        where.category = { equals: filters.category, mode: "insensitive" };
    }
    // Location filters
    if (filters.city) {
        where.city = { equals: filters.city, mode: "insensitive" };
    }
    if (filters.province) {
        where.province = { equals: filters.province, mode: "insensitive" };
    }
    // Free/Paid filter
    if (filters.is_free !== undefined) {
        where.is_free = filters.is_free;
    }
    // Price range filter
    if (filters.min_price !== undefined || filters.max_price !== undefined) {
        where.base_price = {};
        if (filters.min_price !== undefined) {
            where.base_price.gte = new client_1.Prisma.Decimal(filters.min_price);
        }
        if (filters.max_price !== undefined) {
            where.base_price.lte = new client_1.Prisma.Decimal(filters.max_price);
        }
    }
    // Date range filter
    if (filters.start_date_from || filters.start_date_to) {
        where.start_date = {};
        if (filters.start_date_from) {
            where.start_date.gte = filters.start_date_from;
        }
        if (filters.start_date_to) {
            where.start_date.lte = filters.start_date_to;
        }
    }
    // Only show upcoming events by default (start_date >= now)
    if (!filters.start_date_from) {
        where.start_date = Object.assign(Object.assign({}, (where.start_date || {})), { gte: new Date() });
    }
    // Execute query with count
    const [events, total] = yield Promise.all([
        prisma_client_config_1.default.event.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sort_by]: sort_order },
            include: {
                organizer: {
                    select: {
                        id: true,
                        full_name: true,
                    },
                },
                _count: {
                    select: {
                        reviews: true,
                    },
                },
            },
        }),
        prisma_client_config_1.default.event.count({ where }),
    ]);
    return {
        data: events,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
});
exports.getEvents = getEvents;
// Get single event with full details
const getEventById = (eventId) => __awaiter(void 0, void 0, void 0, function* () {
    const event = yield prisma_client_config_1.default.event.findFirst({
        where: {
            id: eventId,
            deleted_at: null,
        },
        include: {
            organizer: {
                select: {
                    id: true,
                    full_name: true,
                    email: true,
                },
            },
            ticket_types: {
                orderBy: { price: "asc" },
            },
            promotions: {
                where: {
                    valid_until: { gte: new Date() },
                    valid_from: { lte: new Date() },
                },
                select: {
                    id: true,
                    code: true,
                    discount_percentage: true,
                    discount_amount: true,
                    valid_from: true,
                    valid_until: true,
                },
            },
            reviews: {
                take: 5,
                orderBy: { created_at: "desc" },
                include: {
                    user: {
                        select: {
                            id: true,
                            full_name: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    reviews: true,
                },
            },
        },
    });
    if (!event) {
        throw new Error("Event not found");
    }
    // Calculate average rating
    const ratingAgg = yield prisma_client_config_1.default.review.aggregate({
        where: { event_id: eventId },
        _avg: { rating: true },
    });
    return Object.assign(Object.assign({}, event), { average_rating: ratingAgg._avg.rating || 0 });
});
exports.getEventById = getEventById;
// Get events by organizer
const getEventsByOrganizer = (organizerId, pagination) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, sort_by = "created_at", sort_order = "desc" } = pagination;
    const skip = (page - 1) * limit;
    const where = {
        organizer_id: organizerId,
        deleted_at: null,
    };
    const [events, total] = yield Promise.all([
        prisma_client_config_1.default.event.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sort_by]: sort_order },
            include: {
                ticket_types: true,
                _count: {
                    select: {
                        transactions: true,
                        reviews: true,
                    },
                },
            },
        }),
        prisma_client_config_1.default.event.count({ where }),
    ]);
    return {
        data: events,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
});
exports.getEventsByOrganizer = getEventsByOrganizer;
// Get distinct categories
const getCategories = () => __awaiter(void 0, void 0, void 0, function* () {
    const categories = yield prisma_client_config_1.default.event.findMany({
        where: { deleted_at: null },
        select: { category: true },
        distinct: ["category"],
        orderBy: { category: "asc" },
    });
    return categories.map((c) => c.category);
});
exports.getCategories = getCategories;
// Get distinct locations (city + province combinations)
const getLocations = () => __awaiter(void 0, void 0, void 0, function* () {
    const locations = yield prisma_client_config_1.default.event.findMany({
        where: {
            deleted_at: null,
            city: { not: null },
        },
        select: {
            city: true,
            province: true,
        },
        distinct: ["city", "province"],
        orderBy: [{ province: "asc" }, { city: "asc" }],
    });
    return locations;
});
exports.getLocations = getLocations;
