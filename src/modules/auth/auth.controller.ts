import { Router } from "express";
import AuthenticationService from "./auth.service"
import { validation } from "../../middleware/validation.middleware";
import * as authValidation from "./auth.validation";

const router = Router();


router.post("/signup", validation(authValidation.signup), AuthenticationService.signup)
router.post("/login", validation(authValidation.login), AuthenticationService.login)
// router.post("/confirmEmail", validation(authValidation.confirmEmail), AuthenticationService.confirmEmail)

export default router