import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { getPurchasesForUser } from "../services/purchase.service";

export const listMine = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const purchases = await getPurchasesForUser(req.user!.id);
    res.status(200).json({ purchases });
  } catch (error) {
    next(error);
  }
};
