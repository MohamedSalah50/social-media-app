import { z } from "zod";
import { generalFields } from "../../middleware/validation.middleware";


export const login = {
    body: z.strictObject({
        email: generalFields.email,
        password: generalFields.password,
    })
}

export const loginConfirmation = {
    body: z.strictObject({
        email: generalFields.email,
        otp: generalFields.otp
    })
}

export const signup = {
    body: login.body.extend({
        username: generalFields.username,
        confirmPassword: generalFields.confirmPassword,
        phone: generalFields.phone.optional()
    }).superRefine((data, ctx) => {
        if (data.password !== data.confirmPassword) {
            ctx.addIssue({ code: "custom", message: "passwords missmatch confirm password", path: ["confirmPassword"] })
        }
    })

    // .refine((data) => {
    //     return data.password === data.confirmPassword
    // }, { error: "passwords missmatch confirm password" })


}

export const confirmEmail = {
    body: z.strictObject({
        email: generalFields.email,
        otp: generalFields.otp
    })
}


export const signupWithGmail = {
    body: z.strictObject({
        idToken: z.string()
    })
}

export const loginWithGmail = {
    body: z.strictObject({
        idToken: z.string()
    })
}

export const sendForgotPasword = {
    body: z.strictObject({
        email: generalFields.email
    })
}

export const verifyForgotPassword = {
    body: sendForgotPasword.body.extend({
        otp: generalFields.otp
    })
}

export const resetForgotPassword = {
    body: verifyForgotPassword.body.extend({
        password: generalFields.password,
        confirmPassword: generalFields.confirmPassword
    }).refine((data) => {
        return data.password === data.confirmPassword
    }, { error: "passwords missmatch confirm password" })
}