"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.twofaEnapleVerify = exports.confirmEmailUpdate = exports.updateEmail = exports.updatePassword = exports.updateBasicInfo = exports.hardDelete = exports.restoreAccount = exports.freezeAccount = exports.logout = exports.welcome = void 0;
const zod_1 = require("zod");
const token_security_1 = require("../../utils/security/token.security");
const mongoose_1 = require("mongoose");
const validation_middleware_1 = require("../../middleware/validation.middleware");
exports.welcome = zod_1.z.strictObject({
    name: zod_1.z.string().min(2)
});
exports.logout = {
    body: zod_1.z.strictObject({
        flag: zod_1.z.enum(token_security_1.LogOutEnum).default(token_security_1.LogOutEnum.only),
    }),
};
exports.freezeAccount = {
    params: zod_1.z
        .object({
        userId: zod_1.z.string().optional(),
    })
        .optional()
        .refine((data) => {
        return data?.userId ? mongoose_1.Types.ObjectId.isValid(data.userId) : true;
    }, {
        message: "invalid objectId format",
        path: ["userId"],
    }),
};
exports.restoreAccount = {
    params: zod_1.z
        .object({
        userId: zod_1.z.string(),
    })
        .refine((data) => {
        return data?.userId && mongoose_1.Types.ObjectId.isValid(data.userId);
    }, {
        message: "invalid objectId format",
        path: ["userId"],
    }),
};
exports.hardDelete = exports.restoreAccount;
exports.updateBasicInfo = {
    body: zod_1.z.object({
        username: validation_middleware_1.generalFields.username.optional(),
        phone: validation_middleware_1.generalFields.phone.optional(),
        gender: validation_middleware_1.generalFields.gender.optional()
    })
};
exports.updatePassword = {
    body: zod_1.z.strictObject({
        oldPassword: validation_middleware_1.generalFields.password,
        password: validation_middleware_1.generalFields.password,
        confirmPassword: validation_middleware_1.generalFields.confirmPassword
    }).refine((data) => {
        return data.password === data.confirmPassword && data.password !== data.oldPassword;
    }, { path: ["password"], error: "passwords missmatch confirm password or password is same as old password" })
};
exports.updateEmail = {
    body: zod_1.z.object({
        newEmail: validation_middleware_1.generalFields.email
    })
    //   .refine((data) => {
    //     return data.email !== data.oldEmail
    //   },
    //     { path: ['email'], error: "email is same as old email" })
};
exports.confirmEmailUpdate = {
    body: zod_1.z.object({
        oldOtp: validation_middleware_1.generalFields.otp,
        newOtp: validation_middleware_1.generalFields.otp
    })
};
exports.twofaEnapleVerify = {
    body: zod_1.z.object({
        otp: validation_middleware_1.generalFields.otp
    })
};
