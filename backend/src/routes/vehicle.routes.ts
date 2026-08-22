import { Router } from "express";
import { create, list } from "../controllers/vehicle.controller";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/", list);
router.post("/", requireAuth, requireAdmin, create);

export default router;
