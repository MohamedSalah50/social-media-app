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
const encryption_security_1 = require("../../utils/security/encryption.security");
const hash_security_1 = require("../../utils/security/hash.security");
const otp_1 = require("../../utils/otp");
const email_event_1 = require("../../utils/events/email.event");
const repository_1 = require("../../db/repository");
const post_model_1 = require("../../db/models/post.model");
const friendRequest_model_1 = require("../../db/models/friendRequest.model");
class UserService {
    userModel = new user_repository_1.userRepository(user_model_1.UserModel);
    postModel = new repository_1.PostRepository(post_model_1.PostModel);
    friendRequestModel = new repository_1.FriendRequestRepository(friendRequest_model_1.FriendRequestModel);
    // private tokenModel = new TokenRepository(TokenModel);
    constructor() { }
    profile = async (req, res) => {
        if (!req.user) {
            throw new error_response_1.UnAuthorizedException("missing user details");
        }
        req.user.phone = (0, encryption_security_1.decryptEncryption)({ cipherText: req.user.phone });
        return (0, success_response_1.successResponse)({
            res,
            data: {
                user: req.user,
            },
        });
    };
    sendFriendRequest = async (req, res) => {
        const { userId } = req.params;
        const checkUserExist = await this.userModel.findOne({
            filter: {
                _id: userId,
                blocked: { $nin: req.user?._id }
            }
        });
        if (!checkUserExist) {
            throw new error_response_1.notFoundException("user not found");
        }
        const checkRequestExist = await this.friendRequestModel.findOne({
            filter: {
                createdBy: req.user?._id,
                sendTo: userId,
                acceptedAt: { $exists: false }
            }
        });
        if (checkRequestExist) {
            throw new error_response_1.conflict("request already sent to the target");
        }
        const [friendRequest] = await this.friendRequestModel.create({
            data: [
                {
                    createdBy: req.user?._id,
                    sendTo: userId
                }
            ]
        }) || [];
        if (!friendRequest) {
            throw new error_response_1.BadRequest("fail to send friend request");
        }
        return (0, success_response_1.successResponse)({
            res,
            data: {
                user: req.user,
            },
        });
    };
    acceptFriendRequest = async (req, res) => {
        const { requestId } = req.params;
        const friendRequest = await this.friendRequestModel.findOneAndUpdate({
            filter: {
                _id: requestId,
                sendTo: req.user?._id,
                acceptedAt: { $exists: false }
            },
            update: {
                acceptedAt: new Date()
            }
        });
        if (!friendRequest) {
            throw new error_response_1.conflict("request not found");
        }
        await Promise.all([
            this.userModel.updateOne({
                filter: { _id: friendRequest.sendTo },
                update: {
                    $addToSet: {
                        friends: friendRequest.createdBy
                    }
                }
            }),
            this.userModel.updateOne({
                filter: { _id: friendRequest.createdBy },
                update: {
                    $addToSet: {
                        friends: friendRequest.sendTo
                    }
                }
            })
        ]);
        return (0, success_response_1.successResponse)({
            res,
            data: {
                user: req.user,
            },
        });
    };
    deleteFriendRequest = async (req, res) => {
        const { requestId } = req.params;
        const deleteRequest = await this.friendRequestModel.deleteOne({
            filter: {
                createdBy: req.user?._id,
                sendTo: requestId,
                acceptedAt: { $exists: false }
            }
        });
        if (!deleteRequest.deletedCount) {
            throw new error_response_1.BadRequest("fail to delete friend request");
        }
        return (0, success_response_1.successResponse)({ res, message: "friend request deleted" });
    };
    dashboard = async (req, res) => {
        const result = await Promise.allSettled([
            this.postModel.find({ filter: {} }),
            this.userModel.find({ filter: {} })
        ]);
        return (0, success_response_1.successResponse)({ res, data: { result } });
    };
    changeRole = async (req, res) => {
        const { userId } = req.params;
        const { role } = req.body;
        const currentAdminLevel = req.user?.role;
        const filter = {
            _id: userId,
            role: {
                $nin: [
                    token_security_1.RoleEnum.superAdmin,
                    currentAdminLevel == token_security_1.RoleEnum.admin ? currentAdminLevel : undefined
                ]
            }
        };
        const update = { role };
        const user = await this.userModel.updateOne({
            filter,
            update,
        });
        if (!user.matchedCount) {
            throw new error_response_1.notFoundException("user not found");
        }
        return (0, success_response_1.successResponse)({ res });
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
    updateBasicInfo = async (req, res) => {
        if (req.body.phone) {
            req.body.phone = await (0, encryption_security_1.generateEncryption)({ plainText: req.body.phone });
        }
        const user = await this.userModel.findOneAndUpdate({
            filter: { _id: req?.user?._id },
            update: req.body,
        });
        if (!user) {
            throw new error_response_1.notFoundException("user not found");
        }
        return (0, success_response_1.successResponse)({ res });
    };
    updatePassword = async (req, res) => {
        const { oldPassword, password } = req.body;
        if (!await (0, hash_security_1.compareHash)(oldPassword, req?.user?.password)) {
            throw new error_response_1.BadRequest("old password not match");
        }
        const user = await this.userModel.findOneAndUpdate({
            filter: { _id: req?.user?._id },
            update: { password: await (0, hash_security_1.generateHash)(password), changeCredentialsTime: Date.now() },
        });
        if (!user) {
            throw new error_response_1.notFoundException("user not found");
        }
        return (0, success_response_1.successResponse)({ res, message: "password updated suuccessfully" });
    };
    updateEmail = async (req, res) => {
        const { newEmail } = req.body;
        //check if newEmail exsists in all userCollection
        if (await this.userModel.findOne({ filter: { email: newEmail } })) {
            throw new error_response_1.BadRequest("email already exsists , please change to another email");
        }
        const user = await this.userModel.findOne({ filter: { email: req.user?.email } });
        const oldOtp = (0, otp_1.generateOtp)();
        const newOtp = (0, otp_1.generateOtp)();
        console.log(oldOtp);
        console.log(newOtp);
        await this.userModel.findOneAndUpdate({
            filter: { email: req.user?.email },
            update: {
                tempEmail: newEmail,
                oldEmailOtp: await (0, hash_security_1.generateHash)(String(oldOtp)),
                newEmailOtp: await (0, hash_security_1.generateHash)(String(newOtp))
            },
        });
        email_event_1.emailEmitter.emit("sendConfirmEmail", { to: user?.email, otp: oldOtp });
        email_event_1.emailEmitter.emit("sendConfirmEmail", { to: newEmail, otp: newOtp });
        return (0, success_response_1.successResponse)({ res, message: "otp sent , please confirm your new email" });
    };
    confirmUpdateEmail = async (req, res) => {
        const { newOtp, oldOtp } = req.body;
        const user = await this.userModel.findOne({ filter: { email: req.user?.email } });
        if (!user?.tempEmail || (!user?.oldEmailOtp && !user?.newEmailOtp)) {
            throw new error_response_1.BadRequest("there's no pending email request");
        }
        if (!await (0, hash_security_1.compareHash)(oldOtp, user.oldEmailOtp)) {
            throw new error_response_1.BadRequest("otps not match");
        }
        if (!await (0, hash_security_1.compareHash)(newOtp, user.newEmailOtp)) {
            throw new error_response_1.BadRequest("otps not match");
        }
        await this.userModel.findOneAndUpdate({
            filter: { email: req.user?.email },
            update: {
                email: user.tempEmail, changeCredentialsTime: Date.now(),
                $unset: { tempEmail: 1, oldEmailOtp: 1, newEmailOtp: 1 }, $inc: { __v: 1 }
            }
        });
        return (0, success_response_1.successResponse)({ res, message: "email updated successfully,please login again" });
    };
    twoFaEnapleRequest = async (req, res) => {
        const user = await this.userModel.findOne({ filter: { _id: req.user?._id } });
        const otp = (0, otp_1.generateOtp)();
        await this.userModel.updateOne({
            filter: { _id: req.user?._id },
            update: { temp2faOtp: await (0, hash_security_1.generateHash)(String(otp)) }
        });
        email_event_1.emailEmitter.emit("sendConfirmEmail", { to: user?.email, otp });
        return (0, success_response_1.successResponse)({ res, message: "otp sent , please confirm your email 2fa" });
    };
    twoFaEnapleConfirm = async (req, res) => {
        const { otp } = req.body;
        const user = await this.userModel.findOne({ filter: { _id: req.user?._id } });
        if (!await (0, hash_security_1.compareHash)(otp, user?.temp2faOtp)) {
            throw new error_response_1.BadRequest("otp mismatch");
        }
        await this.userModel.findOneAndUpdate({
            filter: { _id: req.user?._id },
            update: { is2faEnabled: true, $unset: { temp2faOtp: 1 }, $inc: { __v: 1 } }
        });
        return (0, success_response_1.successResponse)({ res, message: "2fa enabled successfully" });
    };
}
exports.default = new UserService();
