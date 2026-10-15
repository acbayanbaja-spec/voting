import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, authorize } from "../middlewares/auth";
import { Role } from "@prisma/client";

export const auditRouter = Router();

// GET / - View immutable audit logs
auditRouter.get(
  "/",
  authenticate,
  authorize([Role.COMELEC_OFFICER, Role.SYSTEM_ADMIN]),
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const action = req.query.action as string | undefined;

      const where: any = {};
      if (action) {
        where.action = action;
      }

      const [total, logs] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                schoolId: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          logs,
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
