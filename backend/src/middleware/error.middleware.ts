import { ErrorRequestHandler, RequestHandler } from "express";

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ message: "Route not found" });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const statusCode = typeof error.statusCode === "number" ? error.statusCode : 500;
  res.status(statusCode).json({ message: error.message || "Internal server error" });
};
