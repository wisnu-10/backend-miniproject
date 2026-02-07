import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { upload } from "../config/multer.config";
import {
  getMyProfile,
  updateMyProfile,
  updateMyProfilePicture,
  changeMyPassword,
} from "../controllers/profile.controller";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get profile
router.get("/", getMyProfile);

// Update profile
router.put("/", updateMyProfile);

// Update profile picture (multipart/form-data)
router.put(
  "/picture",
  upload.single("profile_picture"),
  updateMyProfilePicture,
);

// Change password
router.put("/password", changeMyPassword);

export default router;
