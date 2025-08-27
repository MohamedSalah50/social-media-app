"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = require("../../db/models/user.model");
const user_repository_1 = require("../../db/repository/user.repository");
const error_response_1 = require("../../utils/response/error.response");
const hash_security_1 = require("../../utils/security/hash.security");
const token_security_1 = require("../../utils/security/token.security");
class AuthenticationService {
    userModel = new user_repository_1.userRepository(user_model_1.UserModel);
    signup = async (req, res) => {
        const { username, email, password } = req.body;
        const existUser = await this.userModel.findOne({ filter: { email } });
        if (existUser) {
            throw new error_response_1.conflict("user already exist");
        }
        // const hashedPassword = generateHash({ plainText: password })
        const [user] = await this.userModel.create({ data: [{ username, email, password }], options: { validateBeforeSave: true } }) || [];
        // emailEmitter.emit("sendConfirmEmail", { to: email, subject: "confirm your email", html: otpEmailTemplate({ otp, title: "confirm your email" }) });
        return res.status(201).json({ message: "signup successful", data: user });
    };
    login = async (req, res) => {
        const { email, password } = req.body;
        const user = await this.userModel.findOne({ filter: { email } });
        if (!user) {
            throw new error_response_1.BadRequest("user not found");
        }
        if (!user.confirmedAt) {
            throw new error_response_1.BadRequest("email not verified , please confirm your email first");
        }
        const matched = await (0, hash_security_1.compareHash)({ plainText: password, cipherText: user.password });
        if (!matched) {
            throw new error_response_1.AppError("invalid password", 400);
        }
        const accessToken = (0, token_security_1.generateToken)({ payload: { id: user._id, email: user.email }, type: "access" });
        const refreshToken = (0, token_security_1.generateToken)({ payload: { id: user._id, email: user.email }, type: "refresh" });
        return res.status(200).json({ message: "login successful", data: { accessToken, refreshToken } });
    };
}
exports.default = new AuthenticationService();
