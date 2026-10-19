import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/lib/prisma";

const app = createApp();

const validPayload = {
  firstName: "Test",
  lastName: "Registration",
  schoolId: `2099-0${Math.floor(1000 + Math.random() * 8999)}`,
  email: `test.reg.${Date.now()}@seait.edu.ph`,
  department: "College of Information and Communication Technology",
  yearLevel: "2nd Year",
  password: "TestPass12345",
};

afterAll(async () => {
  // Clean up accounts created by this suite (never touches seeded accounts)
  try {
    await prisma.user.deleteMany({
      where: { email: { contains: "test.reg." }, firstName: "Test", lastName: "Registration" },
    });
  } catch {
    // DB may be unreachable; nothing to clean
  }
  await prisma.$disconnect();
});

describe("POST /api/v1/auth/register", () => {
  it(
    "should create a student account with the STUDENT role",
    async () => {
      const res = await request(app).post("/api/v1/auth/register").send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe("STUDENT");
      expect(res.body.data.user.schoolId).toBe(validPayload.schoolId);
      // Password material must never appear in the response
      expect(JSON.stringify(res.body)).not.toContain(validPayload.password);
    },
    30000
  );

  it("should reject an invalid email format with 400", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...validPayload, email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should reject a non-institutional email domain with 400", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...validPayload, email: "student@gmail.com" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_EMAIL");
  });

  it("should reject a weak password with 400", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...validPayload, password: "short" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should reject missing required fields with 400", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should reject a malformed student ID with 400", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...validPayload, schoolId: "12345" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_SCHOOL_ID");
  });

  it("should reject a duplicate student ID with 409", async () => {
    // 2024-00123 is a seeded account in the demonstration database
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...validPayload, schoolId: "2024-00123" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("SCHOOL_ID_TAKEN");
  });

  it(
    "must not allow a public registrant to choose an elevated role",
    async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          ...validPayload,
          schoolId: `2099-9${Math.floor(1000 + Math.random() * 8999)}`,
          email: `test.reg.role.${Date.now()}@seait.edu.ph`,
          role: "SYSTEM_ADMIN",
        });

      // The endpoint ignores any client-supplied role entirely; if the account
      // was created it must still be a STUDENT.
      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe("STUDENT");
    },
    30000
  );
});
