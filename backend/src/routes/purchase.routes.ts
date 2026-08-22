import { Router } from "express";
import { create } from "../controllers/purchase.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/", requireAuth, create);

export default router;
