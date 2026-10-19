import { Router } from "express";
import { z } from "zod";
import { authService } from "../services/auth.service";
import { authenticate } from "../middlewares/auth";
import { validateRequest } from "../middlewares/validation";

export const authRouter = Router();

const loginSchema = {
  body: z.object({
    identifier: z.string().min(1, "School ID or email is required"),
    password: z.string().min(1, "Password is required"),
  }),
};

const registerSchema = {
  body: z.object({
    firstName: z.string().trim().min(1, "First name is required").max(60),
    lastName: z.string().trim().min(1, "Last name is required").max(60),
    schoolId: z.string().trim().min(1, "Student ID is required").max(20),
    email: z.string().trim().email("A valid email address is required").max(120),
    department: z.string().min(1, "Department is required"),
    yearLevel: z.string().min(1, "Year level is required"),
    password: z.string().min(10, "Password must be at least 10 characters").max(128),
  }),
};

authRouter.post(
  "/register",
  validateRequest(registerSchema),
  async (req, res, next) => {
    try {
      const { firstName, lastName, schoolId, email, department, yearLevel, password } = req.body;
      const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];

      const user = await authService.register({
        firstName,
        lastName,
        schoolId,
        email,
        department,
        yearLevel,
        password,
        ipAddress: ip,
        userAgent,
      });

      res.status(201).json({
        success: true,
        data: {
          user,
          message:
            "Account created. Your voter eligibility is confirmed by the COMELEC committee per election.",
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

authRouter.post(
  "/login",
  validateRequest(loginSchema),
  async (req, res, next) => {
    try {
      const { identifier, password } = req.body;
      const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];

      const result = await authService.login(identifier, password, ip, userAgent);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

authRouter.get("/me", authenticate, async (req, res, next) => {
  try {
    const profile = await authService.getProfile(req.user!.id);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
});
