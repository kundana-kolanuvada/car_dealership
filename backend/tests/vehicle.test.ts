import jwt from "jsonwebtoken";
import request from "supertest";
import { Role } from "@prisma/client";

const prismaMock = {
  vehicle: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

jest.mock("../src/config/prisma", () => ({ prisma: prismaMock }));

import app from "../src/app";

const adminToken = jwt.sign({ sub: "admin-1", role: Role.ADMIN }, "development-only-secret");
const vehicle = {
  id: "vehicle-1",
  make: "Toyota",
  model: "Camry",
  category: "Sedan",
  price: 29000,
  quantity: 4,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

describe("POST /api/vehicles", () => {
  it("creates a vehicle when requested by an administrator", async () => {
    prismaMock.vehicle.create.mockResolvedValue(vehicle);

    const response = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ make: "Toyota", model: "Camry", category: "Sedan", price: 29000, quantity: 4 });

    expect(response.status).toBe(201);
    expect(response.body.vehicle).toMatchObject({ id: vehicle.id, make: "Toyota", quantity: 4 });
    expect(prismaMock.vehicle.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ make: "Toyota", model: "Camry", price: 29000, quantity: 4 }),
    });
  });

  it("validates vehicle data", async () => {
    const response = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ make: "Toyota", model: "Camry", category: "Sedan", price: -1, quantity: 1.5 });

    expect(response.status).toBe(400);
    expect(prismaMock.vehicle.create).not.toHaveBeenCalled();
  });
});

describe("GET /api/vehicles", () => {
  it("returns all vehicles, newest first", async () => {
    prismaMock.vehicle.findMany.mockResolvedValue([vehicle]);

    const response = await request(app).get("/api/vehicles");

    expect(response.status).toBe(200);
    expect(response.body.vehicles).toHaveLength(1);
    expect(prismaMock.vehicle.findMany).toHaveBeenCalledWith({
      where: undefined,
      orderBy: { createdAt: "desc" },
    });
  });
});

describe("GET /api/vehicles?search=", () => {
  it("searches make, model, and category", async () => {
    prismaMock.vehicle.findMany.mockResolvedValue([vehicle]);

    const response = await request(app).get("/api/vehicles?search=toy");

    expect(response.status).toBe(200);
    expect(response.body.vehicles[0].make).toBe("Toyota");
    expect(prismaMock.vehicle.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { make: { contains: "toy" } },
          { model: { contains: "toy" } },
          { category: { contains: "toy" } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
  });
});
