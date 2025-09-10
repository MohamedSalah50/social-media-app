import { z } from "zod";
import { LogOutEnum } from "../../utils/security/token.security";
import { Types } from "mongoose";
import { generalFields } from "../../middleware/validation.middleware";

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


export const updateBasicInfo = {
  body: z.object({
    username: generalFields.username.optional(),
    phone: generalFields.phone.optional(),
    gender: generalFields.gender.optional()
  })
}


export const updatePassword = {
  body: z.strictObject({
    oldPassword: generalFields.password,
    password: generalFields.password,
    confirmPassword: generalFields.confirmPassword
  }).refine((data) => {
    return data.password === data.confirmPassword && data.password !== data.oldPassword
  }, { path: ["password"], error: "passwords missmatch confirm password or password is same as old password" })
}