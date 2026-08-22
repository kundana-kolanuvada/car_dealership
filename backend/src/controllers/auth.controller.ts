import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { authenticateUser, registerUser } from "../services/auth.service";
import { getUserById } from "../services/auth.service";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

const getJwtSecret = (): string => process.env.JWT_SECRET || "development-only-secret";

const createToken = (userId: string, role: string): string =>
  jwt.sign({ sub: userId, role }, getJwtSecret(), { expiresIn: "1h" });

const hasCredentials = (body: unknown): body is { name?: string; email?: string; password?: string } =>
  typeof body === "object" && body !== null;

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!hasCredentials(req.body) || !req.body.name?.trim() || !req.body.email?.trim() || !req.body.password || req.body.password.length < 8) {
      res.status(400).json({ message: "Name, email, and a password of at least 8 characters are required" });
      return;
    }

    const user = await registerUser(req.body as { name: string; email: string; password: string });
    res.status(201).json({ user, token: createToken(user.id, user.role) });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!hasCredentials(req.body) || !req.body.email?.trim() || !req.body.password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await authenticateUser(req.body.email, req.body.password);
    res.status(200).json({ user, token: createToken(user.id, user.role) });
  } catch (error) {
    next(error);
  }
};

export const me = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserById(req.user!.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};
