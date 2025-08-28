import z from "zod";
import * as validators from "../auth.validation";

export type ISignupBodyInputs = z.infer<typeof validators.signup.body>
export type ILoginBodyInputs = z.infer<typeof validators.login.body>
export type IConfirmEmailInputs = z.infer<typeof validators.confirmEmail.body>