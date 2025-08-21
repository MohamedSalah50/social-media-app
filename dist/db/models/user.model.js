"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userModel = void 0;
const mongoose_1 = require("mongoose");
// import { Document, HydratedDocument } from "mongoose";
// export interface IUser extends Document {
//     username: string;
//     email: string;
//     password: string;
//     phone: string;
//     confirmHashedOtp?: string;
//     isEmailVerified: boolean;
// }
// export type UserDocument = HydratedDocument<IUser>;
const userSchema = new mongoose_1.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    confirmHashedOtp: { type: String },
    isEmailVerified: { type: Boolean, default: false }
}, { timestamps: true });
exports.userModel = mongoose_1.models.User || (0, mongoose_1.model)("User", userSchema);
