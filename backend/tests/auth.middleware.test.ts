import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { Role } from "@prisma/client";
import { requireAdmin, requireAuth } from "../src/middleware/auth.middleware";

const app = express();
app.get("/protected", requireAuth, (req, res) => res.json({ user: (req as any).user }));
app.get("/admin", requireAuth, requireAdmin, (_req, res) => res.status(204).end());

describe("JWT middleware", () => {
  it("rejects a request without a bearer token", async () => {
    await request(app).get("/protected").expect(401);
  });

  it("attaches verified token claims to the request", async () => {
    const token = jwt.sign({ sub: "user-1", role: Role.USER }, "development-only-secret");

    const response = await request(app).get("/protected").set("Authorization", `Bearer ${token}`).expect(200);
    expect(response.body.user).toEqual({ id: "user-1", role: Role.USER });
  });

  it("allows only admins through the admin guard", async () => {
    const userToken = jwt.sign({ sub: "user-1", role: Role.USER }, "development-only-secret");
    const adminToken = jwt.sign({ sub: "admin-1", role: Role.ADMIN }, "development-only-secret");

    await request(app).get("/admin").set("Authorization", `Bearer ${userToken}`).expect(403);
    await request(app).get("/admin").set("Authorization", `Bearer ${adminToken}`).expect(204);
  });
});
