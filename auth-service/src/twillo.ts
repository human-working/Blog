import twilio from "twilio";
import { env } from "./env";

const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

export const sendMfaCode = async (phone: string, code: string) => {
  await client.messages.create({
    body: `Your verification code is: ${code}. Expires in 10 minutes.`,
    from: env.TWILIO_PHONE_NUMBER,
    to: phone
  });
};