import jwt from "jsonwebtoken";
import request from "supertest";
import { Role } from "@prisma/client";

const transactionClient = {
  vehicle: {
    findUnique: jest.fn(),
    updateMany: jest.fn(),
  },
  purchase: {
    create: jest.fn(),
  },
};

const prismaMock = {
  $transaction: jest.fn(async (callback) => callback(transactionClient)),
  vehicle: {
    update: jest.fn(),
  },
};

jest.mock("../src/config/prisma", () => ({ prisma: prismaMock }));

import app from "../src/app";

const userToken = jwt.sign({ sub: "user-1", role: Role.USER }, "development-only-secret");
const adminToken = jwt.sign({ sub: "admin-1", role: Role.ADMIN }, "development-only-secret");
const vehicle = { id: "vehicle-1", price: 29000, quantity: 2 };
const purchase = {
  id: "purchase-1",
  userId: "user-1",
  vehicleId: vehicle.id,
  quantity: 2,
  totalPrice: 58000,
  createdAt: new Date("2026-01-01"),
};

describe("POST /api/purchases", () => {
  it("creates a purchase and decrements stock in one transaction", async () => {
    transactionClient.vehicle.findUnique.mockResolvedValue(vehicle);
    transactionClient.vehicle.updateMany.mockResolvedValue({ count: 1 });
    transactionClient.purchase.create.mockResolvedValue(purchase);

    const response = await request(app)
      .post("/api/purchases")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ vehicleId: vehicle.id, quantity: 2 });

    expect(response.status).toBe(201);
    expect(response.body.purchase).toMatchObject({ id: purchase.id, totalPrice: 58000 });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(transactionClient.vehicle.updateMany).toHaveBeenCalledWith({
      where: { id: vehicle.id, quantity: { gte: 2 } },
      data: { quantity: { decrement: 2 } },
    });
    expect(transactionClient.purchase.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: "user-1", vehicleId: vehicle.id, quantity: 2, totalPrice: 58000 }),
    });
  });

  it("rejects a purchase when stock is zero", async () => {
    transactionClient.vehicle.findUnique.mockResolvedValue({ ...vehicle, quantity: 0 });

    const response = await request(app)
      .post("/api/purchases")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ vehicleId: vehicle.id, quantity: 1 });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("Insufficient vehicle stock");
    expect(transactionClient.vehicle.updateMany).not.toHaveBeenCalled();
    expect(transactionClient.purchase.create).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/vehicles/:id/restock", () => {
  it("restocks a vehicle when requested by an administrator", async () => {
    prismaMock.vehicle.update.mockResolvedValue({ ...vehicle, quantity: 7 });

    const response = await request(app)
      .patch(`/api/vehicles/${vehicle.id}/restock`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ quantity: 5 });

    expect(response.status).toBe(200);
    expect(response.body.vehicle.quantity).toBe(7);
    expect(prismaMock.vehicle.update).toHaveBeenCalledWith({
      where: { id: vehicle.id },
      data: { quantity: { increment: 5 } },
    });
  });

  it("prevents non-administrators from restocking", async () => {
    const response = await request(app)
      .patch(`/api/vehicles/${vehicle.id}/restock`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ quantity: 5 });

    expect(response.status).toBe(403);
    expect(prismaMock.vehicle.update).not.toHaveBeenCalled();
  });
});
