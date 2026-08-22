import jwt from "jsonwebtoken";
import request from "supertest";
import { Role } from "@prisma/client";

const prismaMock = {
  vehicle: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock("../src/config/prisma", () => ({ prisma: prismaMock }));

import app from "../src/app";

const adminToken = jwt.sign({ sub: "admin-1", role: Role.ADMIN }, "development-only-secret");
const userToken = jwt.sign({ sub: "user-1", role: Role.USER }, "development-only-secret");
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

describe("PATCH /api/vehicles/:id", () => {
  it("updates vehicle fields when requested by an administrator", async () => {
    prismaMock.vehicle.update.mockResolvedValue({ ...vehicle, price: 31000, quantity: 2 });

    const response = await request(app)
      .patch(`/api/vehicles/${vehicle.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ price: 31000, quantity: 2 });

    expect(response.status).toBe(200);
    expect(response.body.vehicle).toMatchObject({ id: vehicle.id, price: 31000, quantity: 2 });
    expect(prismaMock.vehicle.update).toHaveBeenCalledWith({
      where: { id: vehicle.id },
      data: { price: 31000, quantity: 2 },
    });
  });

  it("rejects invalid update data", async () => {
    const response = await request(app)
      .patch(`/api/vehicles/${vehicle.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ quantity: -1 });

    expect(response.status).toBe(400);
    expect(prismaMock.vehicle.update).not.toHaveBeenCalled();
  });

  it("returns 404 when the vehicle does not exist", async () => {
    prismaMock.vehicle.update.mockRejectedValue({ code: "P2025" });

    const response = await request(app)
      .patch("/api/vehicles/missing-vehicle")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ price: 31000 });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Vehicle not found");
  });
});

describe("DELETE /api/vehicles/:id", () => {
  it("deletes a vehicle when requested by an administrator", async () => {
    prismaMock.vehicle.delete.mockResolvedValue(vehicle);

    const response = await request(app)
      .delete(`/api/vehicles/${vehicle.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(204);
    expect(prismaMock.vehicle.delete).toHaveBeenCalledWith({ where: { id: vehicle.id } });
  });

  it("prevents non-administrators from deleting a vehicle", async () => {
    const response = await request(app)
      .delete(`/api/vehicles/${vehicle.id}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(403);
    expect(prismaMock.vehicle.delete).not.toHaveBeenCalled();
  });
});
