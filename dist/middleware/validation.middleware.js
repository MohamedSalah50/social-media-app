"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalFields = exports.validation = void 0;
const zod_1 = __importDefault(require("zod"));
const user_model_1 = require("../db/models/user.model");
const validation = (schema) => {
    return (req, res, next) => {
        // const errors: { key: KeyType, issues: { path: string | number | symbol | undefined, message: string }[] }[] = [];
        const errors = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue;
            const validationResult = schema[key].safeParse(req[key]);
            if (!validationResult.success) {
                const error = validationResult.error;
                errors.push({
                    key, issues: error.issues.map((issue) => {
                        return { path: issue.path[0], message: issue.message };
                    })
                });
            }
        }
        if (errors.length) {
            return res.status(400).json({ message: "validation error", errors });
        }
        return next();
    };
};
exports.validation = validation;
exports.generalFields = {
    username: zod_1.default.string().min(2, { message: "username must be at least 2 characters long" }).max(20),
    email: zod_1.default.email(),
    password: zod_1.default.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/),
    confirmPassword: zod_1.default.string(),
    phone: zod_1.default.string(),
    otp: zod_1.default.string().regex(/^\d{6}$/),
    gender: zod_1.default.enum([user_model_1.GenderEnum.male, user_model_1.GenderEnum.female]),
};
