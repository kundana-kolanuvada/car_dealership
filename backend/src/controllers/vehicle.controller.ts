import { NextFunction, Request, Response } from "express";
import { createVehicle, deleteVehicle, getVehicles, updateVehicle } from "../services/vehicle.service";

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

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id;
    if (typeof id !== "string" || id.trim().length === 0) {
      res.status(400).json({ message: "A valid vehicle id is required" });
      return;
    }

    const { make, model, category, price, quantity, ...extraFields } = req.body ?? {};
    const hasUpdates = [make, model, category, price, quantity].some((value) => value !== undefined);
    const valid =
      hasUpdates &&
      Object.keys(extraFields).length === 0 &&
      (make === undefined || isNonEmptyString(make)) &&
      (model === undefined || isNonEmptyString(model)) &&
      (category === undefined || isNonEmptyString(category)) &&
      (price === undefined || isNonNegativeNumber(price)) &&
      (quantity === undefined || (Number.isInteger(quantity) && quantity >= 0));

    if (!valid) {
      res.status(400).json({ message: "Provide at least one valid vehicle field to update" });
      return;
    }

    const vehicle = await updateVehicle(id, { make, model, category, price, quantity });
    res.status(200).json({ vehicle });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id;
    if (typeof id !== "string" || id.trim().length === 0) {
      res.status(400).json({ message: "A valid vehicle id is required" });
      return;
    }

    await deleteVehicle(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
