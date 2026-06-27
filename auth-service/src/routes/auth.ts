import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../env";
import { validate } from "../middleware/validate";
import { sendMfaCode } from "../twillo";
import { verifyCaptcha } from "../captcha";
import { sendVerificationEmail } from "../sendgrid";
import crypto from "crypto";
import { registerSchema, loginSchema } from "../schemas/auth";

const router = Router();
const userRepo = AppDataSource.getRepository(User);

// REGISTER
router.post("/register", validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { email, username, password, captchaToken } = req.body;

    // uses Google v3 to veirfy whether is human
    const isHuman = await verifyCaptcha(captchaToken);
    if (!isHuman) {
      return res.status(400).json({ message: "Captcha verification failed" });
    }

    const existing = await userRepo.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = userRepo.create({ email, username, password: hashed });
    await userRepo.save(user);

    // sends verification Token by Email

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    await userRepo.save(user);

    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({ message: "User registered successfully, please verify your email" });

    
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// LOGIN
router.post("/login", validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password, captchaToken} = req.body;

    // uses Google v3 to veirfy whether is human
    const isHuman = await verifyCaptcha(captchaToken);
    if (!isHuman) {
      return res.status(400).json({ message: "Captcha verification failed" });
    }

    const user = await userRepo.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    // check MFA first before issuing tokens

    if (user.mfaEnabled) {
        const code = crypto.randomInt(100000, 999999).toString();
        user.mfaCode = code;
        user.mfaCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await userRepo.save(user);
        await sendMfaCode(user.phone!, code);

        return res.json({ message: "MFA code sent to your phone", mfaRequired: true });
    }

    // only allows user to proceed if email token has been verified 
    
    if (!user.isVerified) {
    return res.status(401).json({ message: "Please verify your email before logging in" });
    }

    // only issue tokens if MFA not enabled or already verified
    const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        env.JWT_SECRET,
        { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
        { userId: user.id },
        env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
    );

        user.refreshToken = refreshToken;
        await userRepo.save(user);

        res.json({ accessToken, refreshToken });

    } catch (err) {

        res.status(500).json({ message: "Server error", error: err });
    }
});

// VERIFIES USING TOKEN

router.get("/verify", async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    const user = await userRepo.findOne({
      where: { verificationToken: token as string }
    });

    if (!user) return res.status(400).json({ message: "Invalid token" });

    user.isVerified = true;
    user.verificationToken = null;
    await userRepo.save(user);

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// REFRESH TOKEN
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: "No refresh token" });

    const payload = jwt.verify(
      refreshToken,
      env.JWT_REFRESH_SECRET
    ) as unknown as { userId: number };

    const user = await userRepo.findOne({ where: { id: payload.userId } });
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role},
      env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ accessToken });
  } catch (err) {
    res.status(403).json({ message: "Invalid refresh token" });
  }
});

// LOGOUT
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    const user = await userRepo.findOne({ where: { refreshToken } });
    if (user) {
      user.refreshToken = null;
      await userRepo.save(user);
    }

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// returns user by id - used for post verification

router.get("/users/:id", async (req: Request, res: Response) => {
  try {

    // verfies if request is internal between servers - prevent XSS

    const internalSecret = req.headers["x-internal-secret"];
    if (internalSecret !== env.INTERNAL_SERVICE_SECRET) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const user = await userRepo.findOne({ where: { id: Number(req.params.id) } });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ id: user.id, email: user.email, username: user.username });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

export default router;