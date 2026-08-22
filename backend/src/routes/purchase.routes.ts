import { Router } from "express";
import { create } from "../controllers/purchase.controller";
import { listMine } from "../controllers/purchase-history.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/", requireAuth, create);
router.get("/mine", requireAuth, listMine);

export default router;
