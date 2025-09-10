"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetForgotPassword = exports.verifyForgotPassword = exports.sendForgotPasword = exports.loginWithGmail = exports.signupWithGmail = exports.confirmEmail = exports.signup = exports.loginConfirmation = exports.login = void 0;
const zod_1 = require("zod");
const validation_middleware_1 = require("../../middleware/validation.middleware");
exports.login = {
    body: zod_1.z.strictObject({
        email: validation_middleware_1.generalFields.email,
        password: validation_middleware_1.generalFields.password,
    })
};
exports.loginConfirmation = {
    body: zod_1.z.strictObject({
        email: validation_middleware_1.generalFields.email,
        otp: validation_middleware_1.generalFields.otp
    })
};
exports.signup = {
    body: exports.login.body.extend({
        username: validation_middleware_1.generalFields.username,
        confirmPassword: validation_middleware_1.generalFields.confirmPassword,
        phone: validation_middleware_1.generalFields.phone.optional()
    }).superRefine((data, ctx) => {
        if (data.password !== data.confirmPassword) {
            ctx.addIssue({ code: "custom", message: "passwords missmatch confirm password", path: ["confirmPassword"] });
        }
    })
    // .refine((data) => {
    //     return data.password === data.confirmPassword
    // }, { error: "passwords missmatch confirm password" })
};
exports.confirmEmail = {
    body: zod_1.z.strictObject({
        email: validation_middleware_1.generalFields.email,
        otp: validation_middleware_1.generalFields.otp
    })
};
exports.signupWithGmail = {
    body: zod_1.z.strictObject({
        idToken: zod_1.z.string()
    })
};
exports.loginWithGmail = {
    body: zod_1.z.strictObject({
        idToken: zod_1.z.string()
    })
};
exports.sendForgotPasword = {
    body: zod_1.z.strictObject({
        email: validation_middleware_1.generalFields.email
    })
};
exports.verifyForgotPassword = {
    body: exports.sendForgotPasword.body.extend({
        otp: validation_middleware_1.generalFields.otp
    })
};
exports.resetForgotPassword = {
    body: exports.verifyForgotPassword.body.extend({
        password: validation_middleware_1.generalFields.password,
        confirmPassword: validation_middleware_1.generalFields.confirmPassword
    }).refine((data) => {
        return data.password === data.confirmPassword;
    }, { error: "passwords missmatch confirm password" })
};
