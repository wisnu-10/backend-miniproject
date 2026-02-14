import { Router } from "express";
import {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
} from "../controllers/category.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// Public routes
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);

// Protected routes (ORGANIZER only)
router.post("/", authenticate, authorize(["ORGANIZER"]), createCategory);
router.put("/:id", authenticate, authorize(["ORGANIZER"]), updateCategory);
router.delete("/:id", authenticate, authorize(["ORGANIZER"]), deleteCategory);

export default router;
