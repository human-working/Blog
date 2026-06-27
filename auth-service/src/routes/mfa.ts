import { sendMfaCode } from "../twillo";
import { Router, Request, Response } from "express";
import { User } from "../entities/User";
import { AppDataSource } from "../data-source";
import { authenticate, AuthRequest } from "../middleware/authenticate";
import crypto from "crypto";

// These form the routes for MFA via SMS

const router = Router();
const userRepo = AppDataSource.getRepository(User);

// send MFA code
router.post("/mfa/send", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await userRepo.findOne({ where: { id: req.user!.userId } });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.phone) return res.status(400).json({ message: "No phone number on file" });

    // generate 6 digit code
    const code = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); 

    user.mfaCode = code;
    user.mfaCodeExpiry = expiry;
    await userRepo.save(user);

    await sendMfaCode(user.phone, code);

    res.json({ message: "MFA code sent" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// verify MFA code
router.post("/mfa/verify", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body;
    const user = await userRepo.findOne({ where: { id: req.user!.userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    // check code matches and hasn't expired
    if (user.mfaCode !== code) {
      return res.status(401).json({ message: "Invalid code" });
    }

    if (!user.mfaCodeExpiry || user.mfaCodeExpiry < new Date()) {
      return res.status(401).json({ message: "Code has expired" });
    }

    // clear code after use
    user.mfaCode = null;
    user.mfaCodeExpiry = null;
    user.mfaEnabled = true;
    await userRepo.save(user);

    res.json({ message: "MFA verified successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});