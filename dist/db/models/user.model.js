"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = exports.ProviderEnum = void 0;
const mongoose_1 = require("mongoose");
// import { Document, HydratedDocument } from "mongoose";
var GenderEnum;
(function (GenderEnum) {
    GenderEnum["male"] = "male";
    GenderEnum["female"] = "female";
})(GenderEnum || (GenderEnum = {}));
var RoleEnum;
(function (RoleEnum) {
    RoleEnum["user"] = "user";
    RoleEnum["admin"] = "admin";
})(RoleEnum || (RoleEnum = {}));
var ProviderEnum;
(function (ProviderEnum) {
    ProviderEnum["Google"] = "Google";
    ProviderEnum["System"] = "System";
})(ProviderEnum || (exports.ProviderEnum = ProviderEnum = {}));
const userSchema = new mongoose_1.Schema({
    firstName: { type: String, required: true, minLength: 2, maxLength: 20 },
    lastName: { type: String, required: true, minLength: 2, maxLength: 20 },
    email: { type: String, unique: true, required: true },
    confirmEmailOtp: { type: String },
    confirmedAt: { type: Date },
    password: {
        type: String,
        required: function () {
            return this.provider === ProviderEnum.Google ? false : true;
        },
    },
    resetPasswordOtp: { type: String },
    changeCredentialsTime: { type: Date },
    profileImage: { type: String },
    tempProfileImage: { type: String },
    coverImages: [String],
    freezedAt: { type: Date },
    freezedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    restoredAt: { type: Date },
    restoredBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    phone: { type: String },
    address: { type: String },
    gender: { type: String, enum: GenderEnum, default: GenderEnum.male },
    role: { type: String, enum: RoleEnum, default: RoleEnum.user },
    provider: {
        type: String,
        enum: ProviderEnum,
        default: ProviderEnum.System,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
userSchema
    .virtual("username")
    .set(function (value) {
    const [firstName, lastName] = value.split(" ") || [];
    this.set({ firstName, lastName });
})
    .get(function () {
    return this.firstName + " " + this.lastName;
});
exports.UserModel = mongoose_1.models.User || (0, mongoose_1.model)("User", userSchema);
