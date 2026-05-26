export interface TicketDetail {
  name: string;
  quantity: number;
  price: number;
}

export interface TransactionAcceptedData {
  customerName: string;
  eventName: string;
  invoiceNumber: string;
  ticketDetails: TicketDetail[];
  totalAmount: number;
  finalAmount: number;
  eventDate: Date;
  eventLocation?: string;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

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

export const getTransactionAcceptedTemplate = (
  data: TransactionAcceptedData,
): string => {
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

  return `
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
  `;
};
