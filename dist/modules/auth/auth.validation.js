"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmEmail = exports.login = exports.signup = void 0;
const zod_1 = require("zod");
const validation_middleware_1 = require("../../middleware/validation.middleware");
exports.signup = {
    body: zod_1.z.strictObject({
        username: validation_middleware_1.generalFields.username,
        email: validation_middleware_1.generalFields.email,
        password: validation_middleware_1.generalFields.password,
        confirmPassword: validation_middleware_1.generalFields.confirmPassword,
        phone: validation_middleware_1.generalFields.phone
    }).superRefine((data, ctx) => {
        if (data.password !== data.confirmPassword) {
            ctx.addIssue({ code: "custom", message: "passwords missmatch confirm password", path: ["confirmPassword"] });
        }
    })
    // .refine((data) => {
    //     return data.password === data.confirmPassword
    // }, { error: "passwords missmatch confirm password" })
};
exports.login = {
    body: zod_1.z.strictObject({
        email: validation_middleware_1.generalFields.email,
        password: validation_middleware_1.generalFields.password,
    })
};
exports.confirmEmail = {
    body: zod_1.z.strictObject({
        email: validation_middleware_1.generalFields.email,
        otp: zod_1.z.string()
    })
};
