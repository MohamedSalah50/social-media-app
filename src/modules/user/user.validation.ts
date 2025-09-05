import { z } from "zod";
import { LogOutEnum } from "../../utils/security/token.security";
import { Types } from "mongoose";

export const logout = {
  body: z.strictObject({
    flag: z.enum(LogOutEnum).default(LogOutEnum.only),
  }),
};

export const freezeAccount = {
  params: z
    .object({
      userId: z.string().optional(),
    })
    .optional()
    .refine(
      (data) => {
        return data?.userId ? Types.ObjectId.isValid(data.userId) : true;
      },
      {
        message: "invalid objectId format",
        path: ["userId"],
      }
    ),
};

export const restoreAccount = {
  params: z
    .object({
      userId: z.string(),
    })
    .refine(
      (data) => {
        return data?.userId && Types.ObjectId.isValid(data.userId);
      },
      {
        message: "invalid objectId format",
        path: ["userId"],
      }
    ),
};

export const hardDelete = restoreAccount;
