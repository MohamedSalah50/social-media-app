import z from "zod";
import * as validators from "../auth.validation";

export type ISignupBodyInputs = z.infer<typeof validators.signup.body>
export type ILoginBodyInputs = z.infer<typeof validators.login.body>
export type IConfirmEmailInputs = z.infer<typeof validators.confirmEmail.body>
export type ISignupWithGmailInputs = z.infer<typeof validators.signupWithGmail.body>
export type ISendForgotCode = z.infer<typeof validators.sendForgotPasword.body>
export type IVerifyForgotCode = z.infer<typeof validators.verifyForgotPassword.body>
export type IResetForgotCode = z.infer<typeof validators.resetForgotPassword.body>