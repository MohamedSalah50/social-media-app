"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalFields = exports.graphValidation = exports.validation = void 0;
const zod_1 = __importDefault(require("zod"));
const user_model_1 = require("../db/models/user.model");
const mongoose_1 = require("mongoose");
const graphql_1 = require("graphql");
const validation = (schema) => {
    return (req, res, next) => {
        // const errors: { key: KeyType, issues: { path: string | number | symbol | undefined, message: string }[] }[] = [];
        const errors = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue;
            if (req.file) {
                req.body.attachments = req.file;
            }
            if (req.files) {
                req.body.attachments = req.files;
            }
            const validationResult = schema[key].safeParse(req[key]);
            if (!validationResult.success) {
                const error = validationResult.error;
                errors.push({
                    key, issues: error.issues.map((issue) => {
                        return { path: issue.path, message: issue.message };
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
const graphValidation = async (schema, args) => {
    const validationResult = await schema.safeParseAsync(args);
    if (!validationResult.success) {
        const ZError = validationResult.error;
        throw new graphql_1.GraphQLError("validation Error", {
            extensions: {
                statusCode: 400,
                issues: {
                    key: "args",
                    issues: ZError.issues.map((issue) => {
                        return { path: issue.path, message: issue.message };
                    }),
                },
            },
        });
    }
};
exports.graphValidation = graphValidation;
exports.generalFields = {
    username: zod_1.default.string().min(2, { message: "username must be at least 2 characters long" }).max(20),
    email: zod_1.default.email(),
    password: zod_1.default.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/),
    confirmPassword: zod_1.default.string(),
    phone: zod_1.default.string(),
    otp: zod_1.default.string().regex(/^\d{6}$/),
    gender: zod_1.default.enum([user_model_1.GenderEnum.male, user_model_1.GenderEnum.female]),
    file: function (mimtype) {
        return zod_1.default.strictObject({
            fieldname: zod_1.default.string(),
            originalname: zod_1.default.string(),
            encoding: zod_1.default.string(),
            mimetype: zod_1.default.enum(mimtype),
            buffer: zod_1.default.any().optional,
            path: zod_1.default.string().optional,
            size: zod_1.default.number()
        }).refine((data) => {
            return data.buffer || data.path;
        }, {
            path: ["file"],
            error: "neither buffer or path is available"
        });
    },
    id: zod_1.default.string().refine((data) => { return mongoose_1.Types.ObjectId.isValid(data); }, { message: "invalid objectId format" })
};
