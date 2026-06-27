import axios from "axios";
import { env } from "./env";

export const verifyCaptcha = async (token: string): Promise<boolean> => {
  const response = await axios.post(
    `https://www.google.com/recaptcha/api/siteverify`,
    null,
    {
      params: {
        secret: env.RECAPTCHA_SECRET,
        response: token
      }
    }
  );

  const { success, score } = response.data;

  // score is 0.0 - 1.0, 1.0 is very likely human
  // 0.5 is a reasonable threshold
  return success && score >= 0.5;
};