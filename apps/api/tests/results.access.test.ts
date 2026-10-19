import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

let openElectionId: string | null = null;
let studentToken: string | null = null;
let comelecToken: string | null = null;

beforeAll(async () => {
  // Find an election that is not yet PUBLISHED (the seeded OPEN election)
  const elections = await request(app).get("/api/v1/elections?status=OPEN");
  if (elections.body?.data?.length > 0) {
    openElectionId = elections.body.data[0].id;
  }

  // Obtain a real student token from the seeded account
  const studentLogin = await request(app)
    .post("/api/v1/auth/login")
    .send({ identifier: "2024-00123", password: "Student@12345" });
  if (studentLogin.body?.data?.token) {
    studentToken = studentLogin.body.data.token;
  }

  // Obtain a real COMELEC officer token
  const comelecLogin = await request(app)
    .post("/api/v1/auth/login")
    .send({ identifier: "comelec@seait.edu.ph", password: "Comelec@12345" });
  if (comelecLogin.body?.data?.token) {
    comelecToken = comelecLogin.body.data.token;
  }
}, 60000);

describe("GET /api/v1/results/:electionId (publication restriction)", () => {
  it(
    "should reject anonymous access to unpublished results",
    async () => {
      if (!openElectionId) return; // no suitable election in this database
      const res = await request(app).get(`/api/v1/results/${openElectionId}`);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("RESULTS_NOT_PUBLISHED");
    },
    30000
  );

  it(
    "should reject a STUDENT token for unpublished results",
    async () => {
      if (!openElectionId || !studentToken) return;
      const res = await request(app)
        .get(`/api/v1/results/${openElectionId}`)
        .set("Authorization", `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("RESULTS_NOT_PUBLISHED");
    },
    30000
  );

  it(
    "should reject a forged/invalid token for unpublished results",
    async () => {
      if (!openElectionId) return;
      const res = await request(app)
        .get(`/api/v1/results/${openElectionId}`)
        .set("Authorization", "Bearer not.a.real.token");
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("RESULTS_NOT_PUBLISHED");
    },
    30000
  );

  it(
    "should allow a COMELEC officer to preview unpublished tallies",
    async () => {
      if (!openElectionId || !comelecToken) return;
      const res = await request(app)
        .get(`/api/v1/results/${openElectionId}`)
        .set("Authorization", `Bearer ${comelecToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("positions");
      expect(res.body.data).toHaveProperty("resultCommitmentHash");
    },
    30000
  );
});
