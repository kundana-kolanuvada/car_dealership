import { Router } from "express";
import { create, list, remove, restock, update } from "../controllers/vehicle.controller";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/", list);
router.post("/", requireAuth, requireAdmin, create);
router.patch("/:id/restock", requireAuth, requireAdmin, restock);
router.patch("/:id", requireAuth, requireAdmin, update);
router.delete("/:id", requireAuth, requireAdmin, remove);

export default router;
