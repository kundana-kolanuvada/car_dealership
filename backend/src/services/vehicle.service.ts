import { Prisma, Vehicle } from "@prisma/client";
import { prisma } from "../config/prisma";

export type CreateVehicleInput = {
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
};

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
