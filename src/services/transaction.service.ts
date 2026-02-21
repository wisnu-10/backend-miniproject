import prisma from "../config/prisma-client.config";
import { Prisma, TransactionStatus } from "../generated/prisma/client";
import * as pointService from "./point.service";
import {
  sendTransactionAcceptedEmail,
  sendTransactionRejectedEmail,
} from "../config/nodemailer.config";
import cloudinary from "../config/cloudinary.config";

// Types for service inputs
export interface TransactionItemInput {
  ticket_type_id: string;
  quantity: number;
}

export interface CreateTransactionInput {
  user_id: string;
  event_id: string;
  items: TransactionItemInput[];
  promotion_code?: string;
  coupon_code?: string;
  points_to_use?: number;
}

export interface TransactionFilters {
  status?: TransactionStatus;
  date_from?: Date;
  date_to?: Date;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

// Generate unique invoice number
const generateInvoiceNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${year}${month}${day}-${random}`;
};

// Create a new transaction (purchase tickets)
export const createTransaction = async (data: CreateTransactionInput) => {
  const now = new Date();

  // Mutual exclusivity: only one discount option allowed
  const hasPromotion = !!data.promotion_code;
  const hasCoupon = !!data.coupon_code;
  const hasPoints = data.points_to_use && data.points_to_use > 0;

  const optionsUsed = [hasPromotion, hasCoupon, hasPoints].filter(
    Boolean,
  ).length;
  if (optionsUsed > 1) {
    throw new Error(
      "Only one discount option can be used per transaction: promotion_code, coupon_code, or points_to_use",
    );
  }

  // Get event details
  const event = await prisma.event.findFirst({
    where: {
      id: data.event_id,
      deleted_at: null,
    },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  // Validate event hasn't started yet (can't buy tickets for ongoing events)
  if (event.start_date <= now) {
    throw new Error(
      "Cannot purchase tickets for events that have already started",
    );
  }

  // Validate and get ticket types with their quantities
  const ticketTypeIds = data.items.map((item) => item.ticket_type_id);
  const ticketTypes = await prisma.ticketType.findMany({
    where: {
      id: { in: ticketTypeIds },
      event_id: data.event_id,
    },
  });

  if (ticketTypes.length !== ticketTypeIds.length) {
    throw new Error(
      "One or more ticket types not found or don't belong to this event",
    );
  }

  // Check availability and calculate total
  let totalAmount = new Prisma.Decimal(0);
  const itemsWithDetails: {
    ticket_type_id: string;
    quantity: number;
    price: Prisma.Decimal;
    subtotal: Prisma.Decimal;
  }[] = [];

  for (const item of data.items) {
    const ticketType = ticketTypes.find((t) => t.id === item.ticket_type_id);
    if (!ticketType) continue;

    if (ticketType.available_quantity < item.quantity) {
      throw new Error(
        `Not enough tickets available for "${ticketType.name}". Available: ${ticketType.available_quantity}`,
      );
    }

    const subtotal = ticketType.price.mul(item.quantity);
    totalAmount = totalAmount.add(subtotal);
    itemsWithDetails.push({
      ticket_type_id: item.ticket_type_id,
      quantity: item.quantity,
      price: ticketType.price,
      subtotal,
    });
  }

  // Calculate discounts
  let discountAmount = new Prisma.Decimal(0);
  let promotionId: string | null = null;
  let couponId: string | null = null;
  let pointsUsed = 0;

  // Apply promotion if provided
  if (data.promotion_code) {
    const promotion = await prisma.promotion.findFirst({
      where: {
        code: data.promotion_code.toUpperCase(),
        event_id: data.event_id,
        valid_from: { lte: now },
        valid_until: { gte: now },
      },
    });

    if (!promotion) {
      throw new Error("Invalid or expired promotion code");
    }

    if (promotion.current_usage >= promotion.max_usage) {
      throw new Error("Promotion code has reached maximum usage");
    }

    promotionId = promotion.id;

    if (promotion.discount_percentage) {
      const percentDiscount = totalAmount
        .mul(promotion.discount_percentage)
        .div(100);
      discountAmount = discountAmount.add(percentDiscount);
    } else if (promotion.discount_amount) {
      discountAmount = discountAmount.add(promotion.discount_amount);
    }
  }

  // Apply coupon if provided
  if (data.coupon_code) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: data.coupon_code,
        user_id: data.user_id,
        is_used: false,
        valid_from: { lte: now },
        valid_until: { gte: now },
      },
    });

    if (!coupon) {
      throw new Error("Invalid, expired, or already used coupon");
    }

    couponId = coupon.id;

    if (coupon.discount_percentage) {
      const percentDiscount = totalAmount
        .mul(coupon.discount_percentage)
        .div(100);
      discountAmount = discountAmount.add(percentDiscount);
    } else if (coupon.discount_amount) {
      discountAmount = discountAmount.add(coupon.discount_amount);
    }
  }

  // Calculate amount after discounts
  let amountAfterDiscounts = totalAmount.sub(discountAmount);
  if (amountAfterDiscounts.lessThan(0)) {
    amountAfterDiscounts = new Prisma.Decimal(0);
  }

  // Apply points if requested
  if (data.points_to_use && data.points_to_use > 0) {
    const pointsBalance = await pointService.getPointsBalance(data.user_id);

    if (pointsBalance.total_balance < data.points_to_use) {
      throw new Error(
        `Insufficient points. Available: ${pointsBalance.total_balance}, Requested: ${data.points_to_use}`,
      );
    }

    // Can't use more points than the remaining amount
    const maxPointsUsable = Number(amountAfterDiscounts);
    pointsUsed = Math.min(data.points_to_use, maxPointsUsable);
  }

  // Calculate final amount
  const finalAmount = amountAfterDiscounts.sub(pointsUsed);

  // Determine if this is a free transaction
  const isFreeTransaction = finalAmount.lessThanOrEqualTo(0);

  // Set payment deadline to 2 hours from now (not relevant for free transactions)
  const paymentDeadline = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  // Create transaction with all related updates in a single transaction
  const transaction = await prisma.$transaction(async (tx) => {
    // 1. Create the transaction
    const newTransaction = await tx.transaction.create({
      data: {
        user_id: data.user_id,
        event_id: data.event_id,
        invoice_number: generateInvoiceNumber(),
        total_amount: totalAmount,
        discount_amount: discountAmount,
        points_used: pointsUsed,
        final_amount: finalAmount,
        promotion_id: promotionId,
        coupon_id: couponId,
        status: isFreeTransaction
          ? TransactionStatus.WAITING_CONFIRMATION
          : TransactionStatus.WAITING_PAYMENT,
        payment_deadline: paymentDeadline,
        items: {
          create: itemsWithDetails.map((item) => ({
            ticket_type_id: item.ticket_type_id,
            quantity: item.quantity,
            price_at_buy: item.price,
            subtotal: item.subtotal,
          })),
        },
      },
      include: {
        items: {
          include: {
            ticket_type: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            start_date: true,
            end_date: true,
          },
        },
      },
    });

    // 2. Reduce ticket quantities
    for (const item of itemsWithDetails) {
      await tx.ticketType.update({
        where: { id: item.ticket_type_id },
        data: {
          available_quantity: {
            decrement: item.quantity,
          },
        },
      });
    }

    // 3. Update event available seats
    const totalTickets = itemsWithDetails.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    await tx.event.update({
      where: { id: data.event_id },
      data: {
        available_seats: {
          decrement: totalTickets,
        },
      },
    });

    // 4. Mark coupon as used
    if (couponId) {
      await tx.coupon.update({
        where: { id: couponId },
        data: { is_used: true },
      });
    }

    // 5. Increment promotion usage
    if (promotionId) {
      await tx.promotion.update({
        where: { id: promotionId },
        data: {
          current_usage: {
            increment: 1,
          },
        },
      });
    }

    // 6. Deduct points (using FIFO from oldest non-expired)
    if (pointsUsed > 0) {
      const availablePoints = await tx.point.findMany({
        where: {
          user_id: data.user_id,
          expires_at: { gt: now },
          remaining_amount: { gt: 0 },
        },
        orderBy: { expires_at: "asc" },
      });

      let remainingToDeduct = pointsUsed;
      for (const point of availablePoints) {
        if (remainingToDeduct <= 0) break;

        const deductFromThis = Math.min(
          point.remaining_amount,
          remainingToDeduct,
        );
        await tx.point.update({
          where: { id: point.id },
          data: {
            remaining_amount: point.remaining_amount - deductFromThis,
          },
        });
        remainingToDeduct -= deductFromThis;
      }
    }

    return newTransaction;
  });

  return {
    ...transaction,
    total_amount: Number(transaction.total_amount),
    discount_amount: Number(transaction.discount_amount),
    final_amount: Number(transaction.final_amount),
    payment_deadline_formatted: paymentDeadline.toISOString(),
    time_remaining_seconds: Math.max(
      0,
      Math.floor((paymentDeadline.getTime() - Date.now()) / 1000),
    ),
  };
};

// Upload payment proof to Cloudinary
export const uploadPaymentProof = async (
  transactionId: string,
  userId: string,
  file: Express.Multer.File,
) => {
  const now = new Date();

  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      user_id: userId,
    },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  if (transaction.status !== TransactionStatus.WAITING_PAYMENT) {
    throw new Error(
      `Cannot upload payment proof. Current status: ${transaction.status}`,
    );
  }

  if (transaction.payment_deadline < now) {
    throw new Error("Payment deadline has passed. Transaction has expired.");
  }

  // Upload to Cloudinary
  const uploadResult = await new Promise<{ secure_url: string }>(
    (resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "payment_proofs",
          public_id: `payment_${transactionId}_${Date.now()}`,
          transformation: [{ quality: "auto", fetch_format: "auto" }],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as { secure_url: string });
        },
      );
      uploadStream.end(file.buffer);
    },
  );

  const updated = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      payment_proof: uploadResult.secure_url,
      status: TransactionStatus.WAITING_CONFIRMATION,
    },
    include: {
      items: {
        include: {
          ticket_type: true,
        },
      },
      event: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return updated;
};

// Rollback transaction (restore seats, points, coupon, promotion usage)
export const rollbackTransaction = async (transactionId: string) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      items: true,
    },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  await prisma.$transaction(async (tx) => {
    // 1. Restore ticket quantities
    for (const item of transaction.items) {
      await tx.ticketType.update({
        where: { id: item.ticket_type_id },
        data: {
          available_quantity: {
            increment: item.quantity,
          },
        },
      });
    }

    // 2. Restore event available seats
    const totalTickets = transaction.items.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    await tx.event.update({
      where: { id: transaction.event_id },
      data: {
        available_seats: {
          increment: totalTickets,
        },
      },
    });

    // 3. Restore coupon if used
    if (transaction.coupon_id) {
      await tx.coupon.update({
        where: { id: transaction.coupon_id },
        data: { is_used: false },
      });
    }

    // 4. Decrement promotion usage
    if (transaction.promotion_id) {
      await tx.promotion.update({
        where: { id: transaction.promotion_id },
        data: {
          current_usage: {
            decrement: 1,
          },
        },
      });
    }

    // 5. Refund points - create a new point entry with 3 month expiry
    if (transaction.points_used > 0) {
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

      await tx.point.create({
        data: {
          user_id: transaction.user_id,
          amount: transaction.points_used,
          remaining_amount: transaction.points_used,
          expires_at: threeMonthsFromNow,
        },
      });
    }
  });
};

// Cancel transaction (user-initiated)
export const cancelTransaction = async (
  transactionId: string,
  userId: string,
) => {
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      user_id: userId,
    },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  if (transaction.status !== TransactionStatus.WAITING_PAYMENT) {
    throw new Error(
      "Can only cancel transactions that are waiting for payment",
    );
  }

  // Rollback first
  await rollbackTransaction(transactionId);

  // Update status to cancelled
  const updated = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      status: TransactionStatus.CANCELLED,
    },
  });

  return updated;
};

// Update transaction status (organizer accept/reject)
export const updateTransactionStatus = async (
  transactionId: string,
  organizerId: string,
  status: "DONE" | "REJECTED",
  rejectionReason?: string,
) => {
  // Get transaction with event to verify ownership
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      event: true,
      coupon: true,
      items: {
        include: {
          ticket_type: true,
        },
      },
    },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  if (transaction.event.organizer_id !== organizerId) {
    throw new Error("You don't have permission to update this transaction");
  }

  if (transaction.status !== TransactionStatus.WAITING_CONFIRMATION) {
    throw new Error(
      "Can only accept/reject transactions that are waiting for confirmation",
    );
  }

  // Calculate total seats for rollback info
  const totalSeats = transaction.items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  // If rejecting, rollback
  if (status === "REJECTED") {
    await rollbackTransaction(transactionId);
  }

  const updated = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      status:
        status === "DONE" ? TransactionStatus.DONE : TransactionStatus.REJECTED,
    },
    include: {
      items: {
        include: {
          ticket_type: true,
        },
      },
      event: {
        select: {
          id: true,
          name: true,
          start_date: true,
          city: true,
          province: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          full_name: true,
        },
      },
    },
  });

  // Send email notification (don't await to avoid blocking response)
  try {
    if (status === "DONE") {
      // Send acceptance email
      const ticketDetails = updated.items.map((item) => ({
        name: item.ticket_type.name,
        quantity: item.quantity,
        price: Number(item.price_at_buy),
      }));

      const eventLocation = [updated.event.city, updated.event.province]
        .filter(Boolean)
        .join(", ");

      await sendTransactionAcceptedEmail(updated.user.email, {
        customerName: updated.user.full_name,
        eventName: updated.event.name,
        invoiceNumber: updated.invoice_number,
        ticketDetails,
        totalAmount: Number(updated.total_amount),
        finalAmount: Number(updated.final_amount),
        eventDate: updated.event.start_date,
        eventLocation: eventLocation || undefined,
      });
    } else {
      // Send rejection email with refund details
      await sendTransactionRejectedEmail(updated.user.email, {
        customerName: updated.user.full_name,
        eventName: updated.event.name,
        invoiceNumber: updated.invoice_number,
        reason: rejectionReason,
        refundDetails: {
          pointsRefunded:
            transaction.points_used > 0 ? transaction.points_used : undefined,
          couponRestored: transaction.coupon?.code || undefined,
          seatsRestored: totalSeats,
        },
      });
    }
  } catch (emailError) {
    // Log email error but don't fail the transaction update
    console.error("Failed to send transaction status email:", emailError);
  }

  return updated;
};

// Get user transactions
export const getUserTransactions = async (
  userId: string,
  filters: TransactionFilters,
  pagination: PaginationOptions,
) => {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const where: Prisma.TransactionWhereInput = {
    user_id: userId,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.date_from || filters.date_to) {
    where.created_at = {};
    if (filters.date_from) {
      where.created_at.gte = filters.date_from;
    }
    if (filters.date_to) {
      where.created_at.lte = filters.date_to;
    }
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            image: true,
            start_date: true,
            end_date: true,
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
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    data: transactions.map((t) => ({
      ...t,
      total_amount: Number(t.total_amount),
      discount_amount: Number(t.discount_amount),
      final_amount: Number(t.final_amount),
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get transaction by ID
export const getTransactionById = async (
  transactionId: string,
  userId: string,
) => {
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      user_id: userId,
    },
    include: {
      event: {
        select: {
          id: true,
          name: true,
          description: true,
          image: true,
          start_date: true,
          end_date: true,
          city: true,
          province: true,
        },
      },
      items: {
        include: {
          ticket_type: true,
        },
      },
      promotion: {
        select: {
          id: true,
          code: true,
          discount_percentage: true,
          discount_amount: true,
        },
      },
      coupon: {
        select: {
          id: true,
          code: true,
          discount_percentage: true,
          discount_amount: true,
        },
      },
    },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  const now = new Date();
  let timeRemaining = 0;
  if (transaction.status === TransactionStatus.WAITING_PAYMENT) {
    timeRemaining = Math.max(
      0,
      Math.floor(
        (transaction.payment_deadline.getTime() - now.getTime()) / 1000,
      ),
    );
  }

  return {
    ...transaction,
    total_amount: Number(transaction.total_amount),
    discount_amount: Number(transaction.discount_amount),
    final_amount: Number(transaction.final_amount),
    time_remaining_seconds: timeRemaining,
  };
};

// Get transactions for organizer's events
export const getOrganizerTransactions = async (
  organizerId: string,
  filters: TransactionFilters & { event_id?: string },
  pagination: PaginationOptions,
) => {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const where: Prisma.TransactionWhereInput = {
    event: {
      organizer_id: organizerId,
      deleted_at: null,
    },
  };

  if (filters.event_id) {
    where.event_id = filters.event_id;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.date_from || filters.date_to) {
    where.created_at = {};
    if (filters.date_from) {
      where.created_at.gte = filters.date_from;
    }
    if (filters.date_to) {
      where.created_at.lte = filters.date_to;
    }
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            full_name: true,
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
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    data: transactions.map((t) => ({
      ...t,
      total_amount: Number(t.total_amount),
      discount_amount: Number(t.discount_amount),
      final_amount: Number(t.final_amount),
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Expire transactions that haven't uploaded payment proof within 2 hours
export const expireUnpaidTransactions = async () => {
  const now = new Date();

  const expiredTransactions = await prisma.transaction.findMany({
    where: {
      status: TransactionStatus.WAITING_PAYMENT,
      payment_deadline: { lt: now },
    },
  });

  for (const transaction of expiredTransactions) {
    await rollbackTransaction(transaction.id);
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: TransactionStatus.EXPIRED },
    });
  }

  return { expired_count: expiredTransactions.length };
};

// Cancel transactions that haven't been accepted/rejected within 3 days
export const cancelStaleTransactions = async () => {
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const staleTransactions = await prisma.transaction.findMany({
    where: {
      status: TransactionStatus.WAITING_CONFIRMATION,
      updated_at: { lt: threeDaysAgo },
    },
  });

  for (const transaction of staleTransactions) {
    await rollbackTransaction(transaction.id);
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: TransactionStatus.CANCELLED },
    });
  }

  return { cancelled_count: staleTransactions.length };
};
