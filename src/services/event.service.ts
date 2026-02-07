import prisma from "../config/prisma-client.config";
import { Prisma, TransactionStatus } from "../generated/prisma/client";

// Types for service inputs
export interface CreateEventInput {
  organizer_id: string;
  name: string;
  description: string;
  category: string;
  city?: string;
  province?: string;
  start_date: Date;
  end_date: Date;
  total_seats: number;
  base_price: number;
  is_free?: boolean;
  image?: string;
  ticket_types?: {
    name: string;
    description?: string;
    price: number;
    quantity: number;
  }[];
}

export interface UpdateEventInput {
  name?: string;
  description?: string;
  category?: string;
  city?: string;
  province?: string;
  start_date?: Date;
  end_date?: Date;
  total_seats?: number;
  base_price?: number;
  is_free?: boolean;
  image?: string;
}

export interface EventFilters {
  search?: string;
  category?: string;
  city?: string;
  province?: string;
  is_free?: boolean;
  min_price?: number;
  max_price?: number;
  start_date_from?: Date;
  start_date_to?: Date;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sort_by?: "start_date" | "name" | "base_price" | "created_at";
  sort_order?: "asc" | "desc";
}

// Create a new event with optional ticket types
export const createEvent = async (data: CreateEventInput) => {
  const { ticket_types, ...eventData } = data;

  // Determine if event is free based on base_price
  const is_free = data.is_free ?? data.base_price === 0;

  const event = await prisma.event.create({
    data: {
      ...eventData,
      is_free,
      available_seats: eventData.total_seats,
      base_price: new Prisma.Decimal(eventData.base_price),
      ticket_types: ticket_types
        ? {
            create: ticket_types.map((tt) => ({
              name: tt.name,
              description: tt.description,
              price: new Prisma.Decimal(tt.price),
              quantity: tt.quantity,
              available_quantity: tt.quantity,
            })),
          }
        : undefined,
    },
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
};

// Update an existing event
export const updateEvent = async (
  eventId: string,
  organizerId: string,
  data: UpdateEventInput,
) => {
  // Verify ownership
  const existingEvent = await prisma.event.findFirst({
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
  const is_free =
    data.base_price !== undefined
      ? (data.is_free ?? data.base_price === 0)
      : data.is_free;

  // Calculate available_seats if total_seats changes
  let available_seats: number | undefined;
  if (data.total_seats !== undefined) {
    const seatsDiff = data.total_seats - existingEvent.total_seats;
    available_seats = existingEvent.available_seats + seatsDiff;
    if (available_seats < 0) {
      throw new Error("Cannot reduce total seats below already sold tickets");
    }
  }

  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      ...data,
      is_free,
      available_seats,
      base_price:
        data.base_price !== undefined
          ? new Prisma.Decimal(data.base_price)
          : undefined,
    },
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
};

// Soft delete an event
export const deleteEvent = async (eventId: string, organizerId: string) => {
  // Verify ownership
  const existingEvent = await prisma.event.findFirst({
    where: {
      id: eventId,
      organizer_id: organizerId,
      deleted_at: null,
    },
  });

  if (!existingEvent) {
    throw new Error("Event not found or you don't have permission to delete");
  }

  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      deleted_at: new Date(),
    },
  });

  return event;
};

// Get events with filters, search, sorting, and pagination
export const getEvents = async (
  filters: EventFilters,
  pagination: PaginationOptions,
) => {
  const {
    page,
    limit,
    sort_by = "start_date",
    sort_order = "asc",
  } = pagination;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.EventWhereInput = {
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
      where.base_price.gte = new Prisma.Decimal(filters.min_price);
    }
    if (filters.max_price !== undefined) {
      where.base_price.lte = new Prisma.Decimal(filters.max_price);
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
    where.start_date = {
      ...((where.start_date as Prisma.DateTimeFilter) || {}),
      gte: new Date(),
    };
  }

  // Execute query with count
  const [events, total] = await Promise.all([
    prisma.event.findMany({
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
    prisma.event.count({ where }),
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
};

// Get single event with full details
export const getEventById = async (eventId: string) => {
  const event = await prisma.event.findFirst({
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
  const ratingAgg = await prisma.review.aggregate({
    where: { event_id: eventId },
    _avg: { rating: true },
  });

  return {
    ...event,
    average_rating: ratingAgg._avg.rating || 0,
  };
};

// Get events by organizer
export const getEventsByOrganizer = async (
  organizerId: string,
  pagination: PaginationOptions,
) => {
  const {
    page,
    limit,
    sort_by = "created_at",
    sort_order = "desc",
  } = pagination;
  const skip = (page - 1) * limit;

  const where: Prisma.EventWhereInput = {
    organizer_id: organizerId,
    deleted_at: null,
  };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
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
    prisma.event.count({ where }),
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
};

// Get distinct categories
export const getCategories = async () => {
  const categories = await prisma.event.findMany({
    where: { deleted_at: null },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });

  return categories.map((c) => c.category);
};

// Get distinct locations (city + province combinations)
export const getLocations = async () => {
  const locations = await prisma.event.findMany({
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
};

// Get list of attendees for an event (ORGANIZER only)
export const getEventAttendees = async (
  eventId: string,
  organizerId: string,
  pagination: { page: number; limit: number } = { page: 1, limit: 20 },
) => {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  // Verify event ownership
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      organizer_id: organizerId,
      deleted_at: null,
    },
  });

  if (!event) {
    throw new Error(
      "Event not found or you don't have permission to view attendees",
    );
  }

  // Get completed transactions for this event
  const where = {
    event_id: eventId,
    status: TransactionStatus.DONE,
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
        items: {
          include: {
            ticket_type: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  // Transform data to attendee format
  const attendees = transactions.map((t) => {
    const totalTickets = t.items.reduce((sum, item) => sum + item.quantity, 0);
    const ticketTypes = t.items.map((item) => ({
      type: item.ticket_type.name,
      quantity: item.quantity,
      price_per_ticket: Number(item.price_at_buy),
      subtotal: Number(item.subtotal),
    }));

    return {
      id: t.id,
      invoice_number: t.invoice_number,
      attendee: {
        id: t.user.id,
        name: t.user.full_name,
        email: t.user.email,
      },
      tickets: ticketTypes,
      total_tickets: totalTickets,
      total_paid: Number(t.final_amount),
      purchased_at: t.created_at,
    };
  });

  return {
    data: attendees,
    event: {
      id: event.id,
      name: event.name,
      start_date: event.start_date,
    },
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
};
