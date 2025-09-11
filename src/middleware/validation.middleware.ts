import { NextFunction, Request, Response } from "express"
import z, { ZodError, ZodType } from "zod"
import { GenderEnum } from "../db/models/user.model";
import { Types } from "mongoose";

type KeyType = keyof Request; // "body" || "params" || "query" || "headers"
type SchemaType = Partial<Record<KeyType, ZodType>>

export const validation = (schema: SchemaType) => {
    return (req: Request, res: Response, next: NextFunction): Response | NextFunction => {
        // const errors: { key: KeyType, issues: { path: string | number | symbol | undefined, message: string }[] }[] = [];
        const errors: Array<{ key: KeyType, issues: Array<{ path: (string | number | symbol | undefined)[], message: string }> }> = []
        for (const key of Object.keys(schema) as KeyType[]) {
            if (!schema[key]) continue;
            if (req.file) {
                req.body.attachments = req.file
            }
            if (req.files) {
                req.body.attachments = req.files
            }
            const validationResult = schema[key].safeParse(req[key]);
            if (!validationResult.success) {
                const error = validationResult.error as ZodError;
                errors.push({
                    key, issues: error.issues.map((issue) => {
                        return { path: issue.path, message: issue.message }

                    })
                })
            }
        }

        if (errors.length) {
            return res.status(400).json({ message: "validation error", errors })
        }
        return next() as unknown as NextFunction
    }
}


export const generalFields = {
    username: z.string().min(2, { message: "username must be at least 2 characters long" }).max(20),
    email: z.email(),
    password: z.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/),
    confirmPassword: z.string(),
    phone: z.string(),
    otp: z.string().regex(/^\d{6}$/),
    gender: z.enum([GenderEnum.male, GenderEnum.female]),
    file: function (mimtype: string[]) {
        return z.strictObject({
            fieldname: z.string(),
            originalname: z.string(),
            encoding: z.string(),
            mimetype: z.enum(mimtype),
            buffer: z.any().optional,
            path: z.string().optional,
            size: z.number()
        }).refine((data) => {
            return data.buffer || data.path
        }, {
            path: ["file"],
            error: "neither buffer or path is available"
        })
    },
    id: z.string().refine((data) => { return Types.ObjectId.isValid(data) }, { message: "invalid objectId format" })
}