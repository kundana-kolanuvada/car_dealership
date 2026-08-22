import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Role } from "@prisma/client";

export type AuthenticatedRequest = Request & {
  user?: { id: string; role: Role };
};

const getJwtSecret = (): string => process.env.JWT_SECRET || "development-only-secret";

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authorization = req.header("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as JwtPayload;
    if (typeof payload.sub !== "string" || (payload.role !== Role.USER && payload.role !== Role.ADMIN)) {
      res.status(401).json({ message: "Invalid authentication token" });
      return;
    }

    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired authentication token" });
  }
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== Role.ADMIN) {
    res.status(403).json({ message: "Administrator access required" });
    return;
  }

  next();
};
