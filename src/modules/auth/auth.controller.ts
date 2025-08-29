import { Router } from "express";
import AuthenticationService from "./auth.service"
import { validation } from "../../middleware/validation.middleware";
import * as authValidation from "./auth.validation";

const router = Router();


router.post("/signup", validation(authValidation.signup), AuthenticationService.signup)
router.post("/signup-with-gmail", validation(authValidation.signupWithGmail), AuthenticationService.signupWithGmail)
router.post("/login-with-gmail", validation(authValidation.loginWithGmail), AuthenticationService.LoginWithGmail)
router.post("/login", validation(authValidation.login), AuthenticationService.login)
router.post("/confirmEmail", validation(authValidation.confirmEmail), AuthenticationService.confirmEmail)

router.patch("/send-forgot-password", validation(authValidation.sendForgotPasword), AuthenticationService.sendForgotPasword)
router.patch("/verify-forgot-password", validation(authValidation.verifyForgotPassword), AuthenticationService.verifyForgotPassword)
router.patch("/reset-forgot-password", validation(authValidation.resetForgotPassword), AuthenticationService.resetForgotPassword)

export default router