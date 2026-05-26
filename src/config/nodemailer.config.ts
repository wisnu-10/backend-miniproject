import nodemailer from "nodemailer";
import "dotenv/config";
import { getPasswordResetTemplate } from "../templates/password-reset.template";
import {
  getTransactionAcceptedTemplate,
  TransactionAcceptedData,
} from "../templates/transaction-accepted.template";
import {
  getTransactionRejectedTemplate,
  TransactionRejectedData,
} from "../templates/transaction-rejected.template";

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
  const html = getPasswordResetTemplate(resetUrl);

  const mailOptions = {
    from: `"Mini Project" <${process.env.USER_MAILER}>`,
    to,
    subject: "Password Reset Request",
    html,
  };

  await transporter.sendMail(mailOptions);
};

// Send email when transaction is accepted
export const sendTransactionAcceptedEmail = async (
  to: string,
  data: TransactionAcceptedData,
): Promise<void> => {
  const html = getTransactionAcceptedTemplate(data);

  const mailOptions = {
    from: `"Mini Project Events" <${process.env.USER_MAILER}>`,
    to,
    subject: `🎉 Payment Confirmed - ${data.eventName}`,
    html,
  };

  await transporter.sendMail(mailOptions);
};

// Send email when transaction is rejected with refund details
export const sendTransactionRejectedEmail = async (
  to: string,
  data: TransactionRejectedData,
): Promise<void> => {
  const html = getTransactionRejectedTemplate(data);

  const mailOptions = {
    from: `"Mini Project Events" <${process.env.USER_MAILER}>`,
    to,
    subject: `Transaction Rejected - ${data.eventName}`,
    html,
  };

  await transporter.sendMail(mailOptions);
};

export default transporter;
