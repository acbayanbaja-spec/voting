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
