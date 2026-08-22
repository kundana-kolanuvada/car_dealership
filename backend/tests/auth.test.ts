import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import request from "supertest";
import { Role } from "@prisma/client";

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

jest.mock("../src/config/prisma", () => ({ prisma: prismaMock }));

import app from "../src/app";

const user = {
  id: "user-1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  password: "hashed-password",
  role: Role.USER,
  createdAt: new Date("2026-01-01"),
};

describe("POST /api/auth/register", () => {
  it("creates an account, returns a JWT, and never returns the password", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(user);
    jest.spyOn(bcrypt, "hash").mockResolvedValue("hashed-password" as never);

    const response = await request(app)
      .post("/api/auth/register")
      .send({ name: "Ada Lovelace", email: "ADA@EXAMPLE.COM", password: "password123" });

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({ id: user.id, email: user.email, role: Role.USER });
    expect(response.body.user.password).toBeUndefined();
    expect(jwt.verify(response.body.token, "development-only-secret")).toMatchObject({ sub: user.id, role: Role.USER });
    expect(prismaMock.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ email: user.email, password: "hashed-password" }),
    }));
  });

  it("rejects an email that is already registered", async () => {
    prismaMock.user.findUnique.mockResolvedValue(user);

    const response = await request(app)
      .post("/api/auth/register")
      .send({ name: "Ada Lovelace", email: user.email, password: "password123" });

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/already exists/i);
  });
});

describe("POST /api/auth/login", () => {
  it("authenticates valid credentials and returns a JWT", async () => {
    prismaMock.user.findUnique.mockResolvedValue(user);
    jest.spyOn(bcrypt, "compare").mockResolvedValue(true as never);

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "password123" });

    expect(response.status).toBe(200);
    expect(response.body.user.password).toBeUndefined();
    expect(jwt.verify(response.body.token, "development-only-secret")).toMatchObject({ sub: user.id });
  });

  it("rejects invalid credentials", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "wrong-password" });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid email or password");
  });
});
