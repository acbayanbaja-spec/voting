import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, authorize } from "../middlewares/auth";
import { validateRequest } from "../middlewares/validation";
import { Priority, Role } from "@prisma/client";

export const announcementRouter = Router();

// GET / - List active announcements
announcementRouter.get("/", async (req, res, next) => {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    res.json({ success: true, data: announcements });
  } catch (err) {
    next(err);
  }
});

// POST / - Create announcement (COMELEC, ADMIN)
const createSchema = {
  body: z.object({
    title: z.string().min(3),
    content: z.string().min(5),
    priority: z.nativeEnum(Priority).default(Priority.NORMAL),
  }),
};

announcementRouter.post(
  "/",
  authenticate,
  authorize([Role.COMELEC_OFFICER, Role.SYSTEM_ADMIN]),
  validateRequest(createSchema),
  async (req, res, next) => {
    try {
      const announcement = await prisma.announcement.create({
        data: {
          ...req.body,
          authorId: req.user!.id,
        },
      });

      res.status(201).json({ success: true, data: announcement });
    } catch (err) {
      next(err);
    }
  }
);
