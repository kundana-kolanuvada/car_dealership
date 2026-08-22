import { Prisma, Vehicle } from "@prisma/client";
import { prisma } from "../config/prisma";

export type CreateVehicleInput = {
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
};

export type UpdateVehicleInput = Partial<CreateVehicleInput>;

export class VehicleNotFoundError extends Error {
  statusCode = 404;

  constructor() {
    super("Vehicle not found");
  }
}

const isRecordNotFoundError = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError
    ? error.code === "P2025"
    : typeof error === "object" && error !== null && "code" in error && error.code === "P2025";

export const createVehicle = async (input: CreateVehicleInput): Promise<Vehicle> =>
  prisma.vehicle.create({
    data: {
      make: input.make.trim(),
      model: input.model.trim(),
      category: input.category.trim(),
      price: input.price,
      quantity: input.quantity,
    },
  });

export const getVehicles = async (search?: string): Promise<Vehicle[]> => {
  const term = search?.trim();
  const where: Prisma.VehicleWhereInput | undefined = term
    ? {
        OR: [
          { make: { contains: term } },
          { model: { contains: term } },
          { category: { contains: term } },
        ],
      }
    : undefined;

  return prisma.vehicle.findMany({ where, orderBy: { createdAt: "desc" } });
};

export const updateVehicle = async (id: string, input: UpdateVehicleInput): Promise<Vehicle> => {
  try {
    return await prisma.vehicle.update({
      where: { id },
      data: {
        ...(input.make !== undefined && { make: input.make.trim() }),
        ...(input.model !== undefined && { model: input.model.trim() }),
        ...(input.category !== undefined && { category: input.category.trim() }),
        ...(input.price !== undefined && { price: input.price }),
        ...(input.quantity !== undefined && { quantity: input.quantity }),
      },
    });
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      throw new VehicleNotFoundError();
    }
    throw error;
  }
};

export const deleteVehicle = async (id: string): Promise<void> => {
  try {
    await prisma.vehicle.delete({ where: { id } });
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      throw new VehicleNotFoundError();
    }
    throw error;
  }
};

export const restockVehicle = async (id: string, quantity: number): Promise<Vehicle> => {
  try {
    return await prisma.vehicle.update({
      where: { id },
      data: { quantity: { increment: quantity } },
    });
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      throw new VehicleNotFoundError();
    }
    throw error;
  }
};
