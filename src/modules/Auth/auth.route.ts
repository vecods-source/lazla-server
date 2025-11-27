import { Router } from "express";
import {
  signup,
  login,
  refresh,
  logout,
  me,
  resendOtp,
  verfyEmail,
  changePassword,
} from "./auth.controller";
import { requireAuth } from "../../middleware/authMiddleware";
import { rateLimiter } from "../../middleware/rateLimiter";
const router = Router();

router.post("/signup", rateLimiter(5, 10), signup);
router.post("/verfiyotp", rateLimiter(5, 10), verfyEmail);
router.post("/resendotp", rateLimiter(5, 10), resendOtp);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/changePass", requireAuth, changePassword);
router.get("/me", requireAuth, me);

export default router;
