import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { comparePassword, hashPassword } from "../utils/crypto";
import { config } from "../config";
import { Role } from "@prisma/client";

export interface RegisterInput {
  firstName: string;
  lastName: string;
  schoolId: string;
  email: string;
  department: string;
  yearLevel: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

const STUDENT_DEPARTMENTS = [
  "College of Information and Communication Technology",
  "College of Business Administration",
  "College of Education",
  "College of Criminology",
  "Management Information Systems",
];

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export class AuthService {
  /**
   * Creates a student account. The role is fixed to STUDENT on the server —
   * a public registration can never mint COMELEC or administrator accounts.
   * Voting rights are granted separately by COMELEC through per-election
   * eligibility records.
   */
  async register(input: RegisterInput) {
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    const schoolId = input.schoolId.trim();
    const email = input.email.trim().toLowerCase();

    if (!firstName || !lastName) {
      const err: any = new Error("First name and last name are required.");
      err.statusCode = 400;
      err.code = "VALIDATION_ERROR";
      throw err;
    }

    if (!/^[0-9]{4}-[0-9]{5}$/.test(schoolId)) {
      const err: any = new Error("Student ID must follow the format 2024-00123.");
      err.statusCode = 400;
      err.code = "INVALID_SCHOOL_ID";
      throw err;
    }

    if (!/^[^\s@]+@seait\.edu\.ph$/i.test(email)) {
      const err: any = new Error("Email must be an institutional SEAIT address (name@seait.edu.ph).");
      err.statusCode = 400;
      err.code = "INVALID_EMAIL";
      throw err;
    }

    if (!STUDENT_DEPARTMENTS.includes(input.department)) {
      const err: any = new Error("Please select a valid SEAIT department.");
      err.statusCode = 400;
      err.code = "INVALID_DEPARTMENT";
      throw err;
    }

    if (!YEAR_LEVELS.includes(input.yearLevel)) {
      const err: any = new Error("Please select a valid year level.");
      err.statusCode = 400;
      err.code = "INVALID_YEAR_LEVEL";
      throw err;
    }

    if (
      input.password.length < 10 ||
      !/[A-Z]/.test(input.password) ||
      !/[a-z]/.test(input.password) ||
      !/[0-9]/.test(input.password)
    ) {
      const err: any = new Error(
        "Password must be at least 10 characters and contain uppercase, lowercase, and a number."
      );
      err.statusCode = 400;
      err.code = "WEAK_PASSWORD";
      throw err;
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ schoolId }, { email }],
      },
      select: { schoolId: true, email: true },
    });

    if (existing) {
      if (existing.schoolId === schoolId) {
        const err: any = new Error("This Student ID is already registered. Try signing in instead.");
        err.statusCode = 409;
        err.code = "SCHOOL_ID_TAKEN";
        throw err;
      }
      const err: any = new Error("This email address is already registered. Try signing in instead.");
      err.statusCode = 409;
      err.code = "EMAIL_TAKEN";
      throw err;
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        schoolId,
        email,
        department: input.department,
        yearLevel: input.yearLevel,
        passwordHash,
        role: "STUDENT",
        isActive: true,
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
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "ACCOUNT_REGISTERED",
        entity: "User",
        entityId: user.id,
        details: JSON.stringify({ schoolId, department: input.department }),
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });

    // Queue the new student for COMELEC approval on every upcoming/live election
    const pendingElections = await prisma.election.findMany({
      where: { status: { in: ["SCHEDULED", "OPEN"] } },
      select: { id: true },
    });
    if (pendingElections.length) {
      await prisma.voterEligibility.createMany({
        data: pendingElections.map((election) => ({
          electionId: election.id,
          userId: user.id,
          status: "PENDING",
        })),
        skipDuplicates: true,
      });
    }

    return user;
  }

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
