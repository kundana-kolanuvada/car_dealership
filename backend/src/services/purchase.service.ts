import { Prisma, Purchase } from "@prisma/client";
import { prisma } from "../config/prisma";
import { VehicleNotFoundError } from "./vehicle.service";

export class InsufficientStockError extends Error {
  statusCode = 409;

  constructor() {
    super("Insufficient vehicle stock");
  }
}

export const purchaseVehicle = async (
  userId: string,
  vehicleId: string,
  quantity: number,
): Promise<Purchase> =>
  prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId } });

    if (!vehicle) {
      throw new VehicleNotFoundError();
    }

    if (vehicle.quantity < quantity) {
      throw new InsufficientStockError();
    }

    // The conditional update protects stock if another purchase changes it before this transaction commits.
    const stockUpdate = await tx.vehicle.updateMany({
      where: { id: vehicleId, quantity: { gte: quantity } },
      data: { quantity: { decrement: quantity } },
    });

    if (stockUpdate.count !== 1) {
      throw new InsufficientStockError();
    }

    return tx.purchase.create({
      data: {
        userId,
        vehicleId,
        quantity,
        totalPrice: vehicle.price * quantity,
      },
    });
  });
