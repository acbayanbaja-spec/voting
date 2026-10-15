import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { comparePassword, hashPassword } from "../utils/crypto";
import { config } from "../config";
import { Role } from "@prisma/client";

export class AuthService {
  async login(identifier: string, password: string, ipAddress?: string, userAgent?: string) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { schoolId: identifier },
          { email: identifier.toLowerCase() },
        ],
      },
    });

    if (!user) {
      const err: any = new Error("Invalid credentials. Please verify your School ID / Email and password.");
      err.statusCode = 401;
      err.code = "INVALID_CREDENTIALS";
      throw err;
    }

    if (!user.isActive) {
      const err: any = new Error("This account is currently inactive. Contact COMELEC or the System Administrator.");
      err.statusCode = 403;
      err.code = "ACCOUNT_INACTIVE";
      throw err;
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "LOGIN_FAILED",
          entity: "User",
          entityId: user.id,
          details: JSON.stringify({ identifier }),
          ipAddress,
          userAgent,
        },
      });

      const err: any = new Error("Invalid credentials. Please verify your School ID / Email and password.");
      err.statusCode = 401;
      err.code = "INVALID_CREDENTIALS";
      throw err;
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        schoolId: user.schoolId,
        role: user.role,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "LOGIN_SUCCESS",
        entity: "User",
        entityId: user.id,
        ipAddress,
        userAgent,
      },
    });

    return {
      token,
      user: {
        id: user.id,
        schoolId: user.schoolId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
        yearLevel: user.yearLevel,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      const err: any = new Error("User not found.");
      err.statusCode = 404;
      err.code = "USER_NOT_FOUND";
      throw err;
    }

    return user;
  }
}

export const authService = new AuthService();
