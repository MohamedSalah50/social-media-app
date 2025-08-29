import { z } from "zod";
import { LogOutEnum } from "../../utils/security/token.security";

export const logout = {
    body: z.strictObject({
        flag: z.enum(LogOutEnum).default(LogOutEnum.only)
    })
}