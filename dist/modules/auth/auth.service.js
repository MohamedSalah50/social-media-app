"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = require("../../db/models/user.model");
const user_repository_1 = require("../../db/repository/user.repository");
const error_response_1 = require("../../utils/response/error.response");
const hash_security_1 = require("../../utils/security/hash.security");
const email_event_1 = require("../../utils/events/email.event");
const otp_1 = require("../../utils/otp");
const token_security_1 = require("../../utils/security/token.security");
class AuthenticationService {
    userModel = new user_repository_1.userRepository(user_model_1.UserModel);
    signup = async (req, res) => {
        const { username, email, password } = req.body;
        const existUser = await this.userModel.findOne({ filter: { email } });
        if (existUser) {
            throw new error_response_1.conflict("user already exist");
        }
        const otp = (0, otp_1.generateOtp)();
        const [user] = await this.userModel.create({ data: [{ username, email, password: await (0, hash_security_1.generateHash)(password), confirmEmailOtp: await (0, hash_security_1.generateHash)(String(otp)) }], options: { validateBeforeSave: true } }) || [];
        email_event_1.emailEmitter.emit("sendConfirmEmail", { to: email, otp });
        return res.status(201).json({ message: "signup successful", data: user });
    };
    login = async (req, res) => {
        const { email, password } = req.body;
        const user = await this.userModel.findOne({ filter: { email } });
        if (!user) {
            throw new error_response_1.notFoundException("user not found");
        }
        if (!user.confirmedAt) {
            throw new error_response_1.BadRequest("email not confirmed, please confirm your email first");
        }
        if (!await (0, hash_security_1.compareHash)(password, user.password)) {
            throw new error_response_1.notFoundException("in-valid login data");
        }
        const credentials = await (0, token_security_1.createLoginCredentials)(user);
        return res.json({ message: "login successful", data: { credentials } });
    };
    confirmEmail = async (req, res) => {
        const { email, otp } = req.body;
        const user = await this.userModel.findOne({ filter: { email, confirmEmailOtp: { $exists: true }, confirmedAt: { $exists: false } } });
        if (!user) {
            throw new error_response_1.notFoundException("user not found");
        }
        if (!await (0, hash_security_1.compareHash)(otp, user.confirmEmailOtp)) {
            throw new error_response_1.conflict("invalid confirmation code");
        }
        await this.userModel.updateOne({ filter: { email }, update: { confirmedAt: new Date(), $unset: { confirmEmailOtp: 1 } } });
        return res.json({ message: "email confirmed successfully" });
    };
}
exports.default = new AuthenticationService();
