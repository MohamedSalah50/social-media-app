import { z } from "zod";
import { generalFields } from "../../middleware/validation.middleware";


export const login = {
    body: z.strictObject({
        email: generalFields.email,
        password: generalFields.password,
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