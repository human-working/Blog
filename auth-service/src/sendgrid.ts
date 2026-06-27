import sgMail from "@sendgrid/mail";
import { env } from "./env";

sgMail.setApiKey(env.SENDGRID_API_KEY);

export const sendVerificationEmail = async (email: string, token: string) => {
  await sgMail.send({
    to: email,
    from: "noreply@yourapp.com",
    subject: "Verify your account",
    html: `
      <h2>Welcome to the Forum</h2>
      <p>Click the link below to verify your account:</p>
      <a href="http://localhost:3000/verify?token=${token}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `
  });
};

export const sendReplyNotification = async (email: string, postTitle: string) => {
  await sgMail.send({
    to: email,
    from: "noreply@yourapp.com",
    subject: "Someone replied to your post",
    html: `
      <h2>New reply on your post</h2>
      <p>Someone replied to your post <strong>${postTitle}</strong></p>
      <a href="http://localhost:3000/posts">View reply</a>
    `
  });
};