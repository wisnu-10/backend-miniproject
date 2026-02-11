import nodemailer from "nodemailer";
import "dotenv/config";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER_MAILER,
    pass: process.env.PASS_MAILER,
  },
});

export const sendPasswordResetEmail = async (
  to: string,
  resetToken: string,
): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"Mini Project" <${process.env.USER_MAILER}>`,
    to,
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You have requested to reset your password. Click the button below to reset it:</p>
        <a href="${resetUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #007bff; 
                  color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Reset Password
        </a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p style="color: #666; font-size: 12px;">
          This link will expire in 1 hour. If you did not request a password reset, 
          please ignore this email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Types for transaction emails
interface TicketDetail {
  name: string;
  quantity: number;
  price: number;
}

interface TransactionAcceptedData {
  customerName: string;
  eventName: string;
  invoiceNumber: string;
  ticketDetails: TicketDetail[];
  totalAmount: number;
  finalAmount: number;
  eventDate: Date;
  eventLocation?: string;
}

interface TransactionRejectedData {
  customerName: string;
  eventName: string;
  invoiceNumber: string;
  reason?: string;
  refundDetails: {
    pointsRefunded?: number;
    couponRestored?: string;
    seatsRestored: number;
  };
}

// Format currency to IDR
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Format date to readable format
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

// Send email when transaction is accepted
export const sendTransactionAcceptedEmail = async (
  to: string,
  data: TransactionAcceptedData,
): Promise<void> => {
  const ticketRows = data.ticketDetails
    .map(
      (t) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${t.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${t.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(t.price)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(t.price * t.quantity)}</td>
        </tr>
      `,
    )
    .join("");

  const mailOptions = {
    from: `"Mini Project Events" <${process.env.USER_MAILER}>`,
    to,
    subject: `🎉 Payment Confirmed - ${data.eventName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">Payment Confirmed! ✓</h1>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 0 0 8px 8px;">
          <p>Hello <strong>${data.customerName}</strong>,</p>
          
          <p>Great news! Your payment has been confirmed. Here are your ticket details:</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 16px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${data.eventName}</h3>
            <p style="margin: 5px 0; color: #666;">📅 ${formatDate(data.eventDate)}</p>
            ${data.eventLocation ? `<p style="margin: 5px 0; color: #666;">📍 ${data.eventLocation}</p>` : ""}
          </div>
          
          <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 10px; text-align: left;">Ticket Type</th>
                <th style="padding: 10px; text-align: center;">Qty</th>
                <th style="padding: 10px; text-align: right;">Price</th>
                <th style="padding: 10px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${ticketRows}
            </tbody>
            <tfoot>
              <tr style="font-weight: bold; background-color: #f5f5f5;">
                <td colspan="3" style="padding: 10px; text-align: right;">Total Paid:</td>
                <td style="padding: 10px; text-align: right; color: #28a745;">${formatCurrency(data.finalAmount)}</td>
              </tr>
            </tfoot>
          </table>
          
          <div style="background-color: #e7f5e9; padding: 15px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; color: #28a745;">
              <strong>✓ Your tickets are ready!</strong><br>
              Please present this email or your invoice number at the event entrance.
            </p>
          </div>
          
          <p style="color: #666; font-size: 12px;">
            If you have any questions, please contact the event organizer.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Send email when transaction is rejected with refund details
export const sendTransactionRejectedEmail = async (
  to: string,
  data: TransactionRejectedData,
): Promise<void> => {
  const refundItems: string[] = [];

  if (
    data.refundDetails.pointsRefunded &&
    data.refundDetails.pointsRefunded > 0
  ) {
    refundItems.push(
      `<li><strong>${data.refundDetails.pointsRefunded.toLocaleString()} points</strong> have been returned to your account</li>`,
    );
  }

  if (data.refundDetails.couponRestored) {
    refundItems.push(
      `<li>Your coupon <strong>${data.refundDetails.couponRestored}</strong> has been restored and can be used again</li>`,
    );
  }

  if (data.refundDetails.seatsRestored > 0) {
    refundItems.push(
      `<li><strong>${data.refundDetails.seatsRestored} seat(s)</strong> have been released back to availability</li>`,
    );
  }

  const refundSection =
    refundItems.length > 0
      ? `
      <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 10px 0; color: #e65100;"><strong>Refund Details:</strong></p>
        <ul style="margin: 0; padding-left: 20px; color: #666;">
          ${refundItems.join("")}
        </ul>
      </div>
    `
      : "";

  const mailOptions = {
    from: `"Mini Project Events" <${process.env.USER_MAILER}>`,
    to,
    subject: `Transaction Rejected - ${data.eventName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">Transaction Rejected</h1>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 0 0 8px 8px;">
          <p>Hello <strong>${data.customerName}</strong>,</p>
          
          <p>We regret to inform you that your transaction for <strong>${data.eventName}</strong> has been rejected by the event organizer.</p>
          
          <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
          
          ${
            data.reason
              ? `
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 0;"><strong>Reason:</strong> ${data.reason}</p>
            </div>
          `
              : ""
          }
          
          ${refundSection}
          
          <p style="color: #666;">
            Don't worry! You can try purchasing tickets again or contact the event organizer for more information.
          </p>
          
          <p style="color: #666; font-size: 12px;">
            If you believe this was a mistake, please contact the event organizer.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export default transporter;
