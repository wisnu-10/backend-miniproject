import { Router } from "express";
import { register, login, logout } from "../controllers/auth.controller";
import { validateRegister, validateLogin } from "../validators/auth.validator";
import {
  forgotPasswordHandler,
  resetPasswordHandler,
} from "../controllers/profile.controller";

const router = Router();

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPasswordHandler);
router.post("/reset-password", resetPasswordHandler);

export default router;
