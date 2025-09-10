import { z } from "zod";
import { confirmEmailUpdate, freezeAccount, hardDelete, logout, restoreAccount, twofaEnapleVerify, updateEmail, updatePassword } from "./user.validation";

export type ILogoutDto = z.infer<typeof logout.body>;
export type IFreezeAccountDto = z.infer<typeof freezeAccount.params>;
export type IRestoreAccountDto = z.infer<typeof restoreAccount.params>;
export type IHardDeleteAccountDto = z.infer<typeof hardDelete.params>;
export type IUpdatePasswordDto = z.infer<typeof updatePassword.body>
export type IUpdateEmailDto = z.infer<typeof updateEmail.body>
export type IConfirmUpdateEmail = z.infer<typeof confirmEmailUpdate.body>
export type ITwofaEnapleVerifyDto = z.infer<typeof twofaEnapleVerify.body>