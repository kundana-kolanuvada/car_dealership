import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { purchaseVehicle } from "../services/purchase.service";

export const create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { vehicleId, quantity, ...extraFields } = req.body ?? {};
    if (
      Object.keys(extraFields).length > 0 ||
      typeof vehicleId !== "string" ||
      vehicleId.trim().length === 0 ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      res.status(400).json({ message: "A vehicle id and a positive integer quantity are required" });
      return;
    }

    const purchase = await purchaseVehicle(req.user!.id, vehicleId, quantity);
    res.status(201).json({ purchase });
  } catch (error) {
    next(error);
  }
};
