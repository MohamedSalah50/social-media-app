"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = require("../../db/models/user.model");
const user_repository_1 = require("../../db/repository/user.repository");
const error_response_1 = require("../../utils/response/error.response");
const hash_security_1 = require("../../utils/security/hash.security");
const email_event_1 = require("../../utils/events/email.event");
const otp_1 = require("../../utils/otp");
const token_security_1 = require("../../utils/security/token.security");
const google_auth_library_1 = require("google-auth-library");
const success_response_1 = require("../../utils/response/success.response");
class AuthenticationService {
    userModel = new user_repository_1.userRepository(user_model_1.UserModel);
    async verifyGmailAccount(idToken) {
        const client = new google_auth_library_1.OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.WEB_CLIENT_IDS?.split(",") || [],
        });
        const payload = ticket.getPayload();
        if (!payload?.email_verified) {
            throw new error_response_1.BadRequest("fail to  verify this account");
        }
        return payload;
    }
    LoginWithGmail = async (req, res) => {
        const { idToken } = req.body;
        const { email } = await this.verifyGmailAccount(idToken);
        const user = await this.userModel.findOne({ filter: { email } });
        if (!user) {
            throw new error_response_1.BadRequest("not registered account or registered with another provider");
        }
        const credentials = await (0, token_security_1.createLoginCredentials)(user);
        return (0, success_response_1.successResponse)({ res, data: { credentials } });
    };
    signupWithGmail = async (req, res) => {
        const { idToken } = req.body;
        const { email, family_name, given_name, picture } = await this.verifyGmailAccount(idToken);
        const user = await this.userModel.findOne({ filter: { email } });
        if (user) {
            if (user.provider === user_model_1.ProviderEnum.Google) {
                return await this.LoginWithGmail(req, res);
            }
            throw new error_response_1.conflict(`user already exist with another provider ::: ${user.provider}`);
        }
        const [newUser] = (await this.userModel.create({
            data: [
                {
                    firstName: given_name,
                    lastName: family_name,
                    profileImage: picture,
                    confirmedAt: new Date(),
                },
            ],
        })) || [];
        if (!newUser) {
            throw new error_response_1.BadRequest("fail to signup with gmail , please try again later");
        }
        const credentials = await (0, token_security_1.createLoginCredentials)(newUser);
        return (0, success_response_1.successResponse)({ res, data: { credentials } });
    };
    signup = async (req, res) => {
        const { username, email, password } = req.body;
        const existUser = await this.userModel.findOne({ filter: { email } });
        if (existUser) {
            throw new error_response_1.conflict("user already exist");
        }
        const otp = (0, otp_1.generateOtp)();
        (await this.userModel.create({
            data: [
                {
                    username,
                    email,
                    password: await (0, hash_security_1.generateHash)(password),
                    confirmEmailOtp: await (0, hash_security_1.generateHash)(String(otp)),
                },
            ],
            options: { validateBeforeSave: true },
        })) || [];
        email_event_1.emailEmitter.emit("sendConfirmEmail", { to: email, otp });
        return (0, success_response_1.successResponse)({ res, statusCode: 201 });
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
        if (!(await (0, hash_security_1.compareHash)(password, user.password))) {
            throw new error_response_1.notFoundException("in-valid login data");
        }
        const credentials = await (0, token_security_1.createLoginCredentials)(user);
        return (0, success_response_1.successResponse)({ res, data: { credentials } });
    };
    confirmEmail = async (req, res) => {
        const { email, otp } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                confirmEmailOtp: { $exists: true },
                confirmedAt: { $exists: false },
            },
        });
        if (!user) {
            throw new error_response_1.notFoundException("user not found");
        }
        if (!(await (0, hash_security_1.compareHash)(otp, user.confirmEmailOtp))) {
            throw new error_response_1.conflict("invalid confirmation code");
        }
        await this.userModel.updateOne({
            filter: { email },
            update: { confirmedAt: new Date(), $unset: { confirmEmailOtp: 1 } },
        });
        return (0, success_response_1.successResponse)({ res, message: "email confirmed successfully" });
    };
    sendForgotPasword = async (req, res) => {
        const { email } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: user_model_1.ProviderEnum.System,
                confirmedAt: { $exists: true },
            },
        });
        if (!user) {
            throw new error_response_1.notFoundException("invalid account due to one of this reasons: 1 - not registered account 2 - not confirmed account 3 - account provider is not system");
        }
        const otp = (0, otp_1.generateOtp)();
        const result = await this.userModel.updateOne({
            filter: { email },
            update: { resetPasswordOtp: await (0, hash_security_1.generateHash)(String(otp)) },
        });
        if (!result.matchedCount) {
            throw new error_response_1.conflict("fail to send forgot password code, please try again later");
        }
        email_event_1.emailEmitter.emit("forgotPassword", { to: email, otp });
        return (0, success_response_1.successResponse)({ res });
    };
    verifyForgotPassword = async (req, res) => {
        const { email, otp } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: user_model_1.ProviderEnum.System,
                resetPasswordOtp: { $exists: true },
            },
        });
        if (!user) {
            throw new error_response_1.notFoundException("invalid account due to one of this reasons: 1 - not registered account 2 - not confirmed account 3 - account provider is not system 4 - account doesn't have forgot password otp");
        }
        if (!(await (0, hash_security_1.compareHash)(otp, user.resetPasswordOtp))) {
            throw new error_response_1.conflict("invalid forgot password code");
        }
        return (0, success_response_1.successResponse)({ res });
    };
    resetForgotPassword = async (req, res) => {
        const { email, otp, password } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: user_model_1.ProviderEnum.System,
                resetPasswordOtp: { $exists: true },
            },
        });
        if (!user) {
            throw new error_response_1.notFoundException("invalid account due to one of this reasons: 1 - not registered account 2 - not confirmed account 3 - account provider is not system 4 - account doesn't have forgot password otp");
        }
        if (!(await (0, hash_security_1.compareHash)(otp, user.resetPasswordOtp))) {
            throw new error_response_1.conflict("invalid forgot password code");
        }
        const result = await this.userModel.updateOne({
            filter: { email },
            update: {
                changeCredentialsTime: new Date(),
                password: await (0, hash_security_1.generateHash)(password),
                $unset: { resetPasswordOtp: 1 },
            },
        });
        if (!result.matchedCount) {
            throw new error_response_1.conflict("fail to reset password, please try again later");
        }
        return (0, success_response_1.successResponse)({ res });
    };
}
exports.default = new AuthenticationService();
