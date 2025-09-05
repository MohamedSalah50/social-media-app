"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = require("../../db/models/user.model");
const token_security_1 = require("../../utils/security/token.security");
const user_repository_1 = require("../../db/repository/user.repository");
const s3_config_1 = require("../../utils/multer/s3.config");
const cloud_multer_1 = require("../../utils/multer/cloud.multer");
const error_response_1 = require("../../utils/response/error.response");
const s3_events_1 = __importDefault(require("../../utils/multer/s3.events"));
const success_response_1 = require("../../utils/response/success.response");
class UserService {
    userModel = new user_repository_1.userRepository(user_model_1.UserModel);
    // private tokenModel = new TokenRepository(TokenModel);
    constructor() { }
    profile = async (req, res) => {
        if (!req.user) {
            throw new error_response_1.UnAuthorizedException("missing user details");
        }
        return (0, success_response_1.successResponse)({
            res,
            data: {
                user: req.user,
            },
        });
    };
    profileImage = async (req, res) => {
        const { contentType, originalname, } = req.body;
        const { url, Key } = await (0, s3_config_1.createSignedUploadLink)({
            path: `users/${req.decoded?._id}`,
            ContentType: contentType,
            OriginalName: originalname,
        });
        const user = await this.userModel.findByIdAndUpdate({
            id: req.user?._id,
            update: { profileImage: Key, tempProfileImage: req.user?.profileImage },
        });
        if (!user) {
            throw new error_response_1.BadRequest("fail to update user profile image");
        }
        s3_events_1.default.emit("trackProfileImageUpload", {
            userId: req.user?._id,
            oldKey: req.user?.profileImage,
            Key,
        });
        return (0, success_response_1.successResponse)({ res, data: { url } });
        // const key = await uploadFile({
        //   file: req.file as Express.Multer.File,
        //   path: `users/${req.decoded?._id}`,
        // });
        // return res.json({
        //   message: "profile-image",
        //   data: {
        //     key,
        //   },
        // });
    };
    profileCoverImage = async (req, res) => {
        const urls = await (0, s3_config_1.uploadFiles)({
            storageAppraoch: cloud_multer_1.storageEnum.disk,
            files: req.files,
            path: `users/${req.decoded?._id}/cover`,
        });
        const user = await this.userModel.findByIdAndUpdate({
            id: req.user?._id,
            update: { coverImage: urls },
        });
        if (!user) {
            throw new error_response_1.BadRequest("fail to update user profile cover images");
        }
        if (req.user?.coverImages) {
            await (0, s3_config_1.deleteFiles)({ urls: req.user?.coverImages });
        }
        return (0, success_response_1.successResponse)({ res, data: { user } });
    };
    logout = async (req, res) => {
        const flag = req.body;
        let statusCode = 200;
        const update = {};
        switch (flag) {
            case token_security_1.LogOutEnum.all:
                update.changeCredentialsTime = new Date();
                break;
            default:
                await (0, token_security_1.createRevokeToken)(req.decoded);
                statusCode = 201;
                break;
        }
        await this.userModel.updateOne({ filter: { _id: req.user?._id }, update });
        return (0, success_response_1.successResponse)({ res });
    };
    refreshToken = async (req, res) => {
        const credentials = await (0, token_security_1.createLoginCredentials)(req.user);
        await (0, token_security_1.createRevokeToken)(req.decoded);
        return (0, success_response_1.successResponse)({ res, data: { credentials } });
    };
    freezeAccount = async (req, res) => {
        const { userId } = req.params || {};
        if (userId && req.user?.role !== token_security_1.RoleEnum.admin) {
            throw new error_response_1.ForbiddenException("not authorized user");
        }
        const user = await this.userModel.updateOne({
            filter: { _id: userId || req.user?._id, freezedAt: { $exists: false } },
            update: {
                freezedAt: new Date(),
                freezedBy: req.user?._id,
                changeCredentialsTime: new Date(),
                $unset: { restoredAt: 1, restoredBy: 1 },
            },
        });
        if (!user.matchedCount) {
            throw new error_response_1.notFoundException("user not found or fail to freeze account");
        }
        return (0, success_response_1.successResponse)({ res });
    };
    restoreAccount = async (req, res) => {
        const { userId } = req.params;
        const user = await this.userModel.updateOne({
            filter: { _id: userId, freezedAt: { $ne: userId } },
            update: {
                restoredAt: new Date(),
                restoredBy: req.user?._id,
                changeCredentialsTime: new Date(),
                $unset: { freezedAt: 1, freezedBy: 1 },
            },
        });
        if (!user.matchedCount) {
            throw new error_response_1.notFoundException("user not found or fail to restore account");
        }
        return (0, success_response_1.successResponse)({ res });
    };
    hardDeleteAccount = async (req, res) => {
        const { userId } = req.params;
        const user = await this.userModel.deleteOne({
            filter: { _id: userId, freezedAt: { $exists: true } },
        });
        if (!user.deletedCount) {
            throw new error_response_1.notFoundException("user not found or fail to hardDelete account");
        }
        await (0, s3_config_1.deleteFolderByPrefix)({ path: `users/${userId}` });
        return (0, success_response_1.successResponse)({ res });
    };
}
exports.default = new UserService();
