import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, authorize } from "../middlewares/auth";
import { validateRequest } from "../middlewares/validation";
import { Role } from "@prisma/client";
import { hashPassword } from "../utils/crypto";

export const userRouter = Router();

// GET / - List users
userRouter.get(
  "/",
  authenticate,
  authorize([Role.SYSTEM_ADMIN]),
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const role = req.query.role as Role | undefined;

      const where: any = {};
      if (role) where.role = role;

      const [total, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            schoolId: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            department: true,
            yearLevel: true,
            isActive: true,
            createdAt: true,
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST / - Create user
const createUserSchema = {
  body: z.object({
    schoolId: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    role: z.nativeEnum(Role).default(Role.STUDENT),
    department: z.string().default("General"),
    yearLevel: z.string().default("1st Year"),
  }),
};

userRouter.post(
  "/",
  authenticate,
  authorize([Role.SYSTEM_ADMIN]),
  validateRequest(createUserSchema),
  async (req, res, next) => {
    try {
      const passwordHash = await hashPassword(req.body.password);
      const user = await prisma.user.create({
        data: {
          ...req.body,
          passwordHash,
        },
        select: {
          id: true,
          schoolId: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          department: true,
          yearLevel: true,
          isActive: true,
          createdAt: true,
        },
      });

      res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /:id/status - Toggle active/inactive
userRouter.patch(
  "/:id/status",
  authenticate,
  authorize([Role.SYSTEM_ADMIN]),
  async (req, res, next) => {
    try {
      const { isActive } = req.body;
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { isActive: Boolean(isActive) },
        select: {
          id: true,
          schoolId: true,
          isActive: true,
        },
      });

      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }
);
