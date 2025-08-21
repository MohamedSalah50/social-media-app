"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = require("../../db/models/user.model");
const hash_security_1 = require("../../utils/security/hash.security");
const encryption_security_1 = require("../../utils/security/encryption.security");
const email_event_1 = require("../../utils/events/email.event");
const template_email_1 = require("../../utils/email/template.email");
const error_response_1 = require("../../utils/response/error.response");
const token_security_1 = require("../../utils/security/token.security");
// const nanoid = require("nanoid");
// import { nanoid } from "nanoid";
class AuthenticationService {
    signup = async (req, res) => {
        const { username, email, password, phone } = req.body;
        const exsistingUser = await user_model_1.userModel.findOne({ email });
        if (exsistingUser) {
            throw new error_response_1.AppError("user already exists", 400);
        }
        const hashedPassword = (0, hash_security_1.generateHash)({ plainText: password });
        const encryptedPhone = (0, encryption_security_1.generateEncryption)({ plainText: phone });
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = (0, hash_security_1.generateHash)({ plainText: otp });
        // const user = await userModel.create({ username, email, password, phone });
        //ال create عماله تجيبلي typeError مش عارف ليه فاستحدمت insertOne , بس هيا شغاله يعني ك logic واليوزر بينضاف عادي ف ال database
        const user = await user_model_1.userModel.insertOne({ username, email, password: hashedPassword, phone: encryptedPhone, confirmHashedOtp: hashedOtp });
        email_event_1.emailEmitter.emit("sendConfirmEmail", { to: email, subject: "confirm your email", html: (0, template_email_1.otpEmailTemplate)({ otp, title: "confirm your email" }) });
        return res.status(201).json({ message: "signup successful", data: user });
    };
    login = async (req, res) => {
        const { email, password } = req.body;
        const user = await user_model_1.userModel.findOne({ email });
        if (!user) {
            throw new error_response_1.AppError("user not found", 400);
        }
        if (!user.isEmailVerified) {
            throw new error_response_1.AppError("email not verified , please confirm your email first", 400);
        }
        const matched = await (0, hash_security_1.compareHash)({ plainText: password, cipherText: user.password });
        if (!matched) {
            throw new error_response_1.AppError("invalid password", 400);
        }
        const accessToken = (0, token_security_1.generateToken)({ payload: { id: user._id, email: user.email }, type: "access" });
        const refreshToken = (0, token_security_1.generateToken)({ payload: { id: user._id, email: user.email }, type: "refresh" });
        return res.status(200).json({ message: "login successful", data: { accessToken, refreshToken } });
    };
    confirmEmail = async (req, res) => {
        const { otp, email } = req.body;
        const user = await user_model_1.userModel.findOne({ email });
        if (!user) {
            throw new error_response_1.AppError("user not found", 400);
        }
        const matched = await (0, hash_security_1.compareHash)({ plainText: otp, cipherText: user.confirmHashedOtp });
        if (!matched) {
            throw new error_response_1.AppError("invalid otp", 400);
        }
        await user_model_1.userModel.updateOne({ email }, { $unset: { confirmHashedOtp: "" }, $set: { isEmailVerified: true } });
        return res.status(200).json({ message: "email confirmed 🎉" });
    };
}
exports.default = new AuthenticationService();
