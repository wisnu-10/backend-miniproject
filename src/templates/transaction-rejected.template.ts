export interface TransactionRejectedData {
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

export const getTransactionRejectedTemplate = (
  data: TransactionRejectedData,
): string => {
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

  return `
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
  `;
};
