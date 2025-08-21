import { z } from "zod";
import { generalFields } from "../../middleware/validation.middleware";

export const signup = {
    body: z.strictObject({
        username: generalFields.username,
        email: generalFields.email,
        password: generalFields.password,
        confirmPassword: generalFields.confirmPassword,
        phone: generalFields.phone
    }).superRefine((data, ctx) => {
        if (data.password !== data.confirmPassword) {
            ctx.addIssue({ code: "custom", message: "passwords missmatch confirm password", path: ["confirmPassword"] })
        }
    })

    // .refine((data) => {
    //     return data.password === data.confirmPassword
    // }, { error: "passwords missmatch confirm password" })


}


export const login = {
    body: z.strictObject({
        email: generalFields.email,
        password: generalFields.password,
    })
}

export const confirmEmail = {
    body: z.strictObject({
        email: generalFields.email,
        otp: z.string()
    })
}