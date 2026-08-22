import { NextFunction, Request, Response } from "express";
import { createVehicle, getVehicles } from "../services/vehicle.service";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNonNegativeNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { make, model, category, price, quantity } = req.body ?? {};
    if (
      !isNonEmptyString(make) ||
      !isNonEmptyString(model) ||
      !isNonEmptyString(category) ||
      !isNonNegativeNumber(price) ||
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      res.status(400).json({ message: "Make, model, category, non-negative price, and non-negative integer quantity are required" });
      return;
    }

    const vehicle = await createVehicle({ make, model, category, price, quantity });
    res.status(201).json({ vehicle });
  } catch (error) {
    next(error);
  }
};

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const vehicles = await getVehicles(search);
    res.status(200).json({ vehicles });
  } catch (error) {
    next(error);
  }
};
