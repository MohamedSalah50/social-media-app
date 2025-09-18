"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const success_response_1 = require("../../utils/response/success.response");
const mongoose_1 = require("mongoose");
const repository_1 = require("../../db/repository");
const post_model_1 = require("../../db/models/post.model");
const user_model_1 = require("../../db/models/user.model");
const comment_model_1 = require("../../db/models/comment.model");
const error_response_1 = require("../../utils/response/error.response");
const s3_config_1 = require("../../utils/multer/s3.config");
const cloud_multer_1 = require("../../utils/multer/cloud.multer");
class CommentService {
    userModel = new repository_1.userRepository(user_model_1.UserModel);
    postModel = new repository_1.PostRepository(post_model_1.PostModel);
    commentModel = new repository_1.commentRepository(comment_model_1.CommentModel);
    constructor() { }
    getCommentById = async (req, res) => {
        const { commentId } = req.params;
        const comment = await this.commentModel.findOne({
            filter: {
                _id: commentId,
                createdBy: req.user?._id,
                freezedAt: { $exists: false }
            }
        });
        if (!comment) {
            throw new error_response_1.notFoundException("comment not found");
        }
        return (0, success_response_1.successResponse)({ res, data: comment });
    };
    createComment = async (req, res) => {
        const { postId } = req.params;
        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                allowComments: post_model_1.AllowCommentsEnum.allow,
                $or: [
                    { availability: post_model_1.AvailabilityEnum.public },
                    {
                        availability: post_model_1.AvailabilityEnum.friends, createdBy: {
                            $in: [...(req.user?.friends || []), req.user?._id]
                        }
                    },
                    {
                        availability: post_model_1.AvailabilityEnum.onlyMe, createdBy: req.user?._id
                    }, {
                        tags: { $in: [req.user?._id] }
                    }
                ]
            }
        });
        if (!post) {
            throw new error_response_1.notFoundException("no matching post");
        }
        if (req.body.tags?.length &&
            (await this.userModel.find({ filter: { _id: { $in: req.body.tags } } })).length !== req.body.tags.length) {
            throw new error_response_1.notFoundException("some of the mentioned users does not exist");
        }
        let attachments = [];
        if (req.files?.length) {
            attachments = await (0, s3_config_1.uploadFiles)({
                storageAppraoch: cloud_multer_1.storageEnum.memory,
                path: `users/${req.user?._id}/post/${post.assetsFolderId}/comment`,
                files: req.files
            });
        }
        const [comment] = await this.commentModel.create({
            data: [{
                    ...req.body,
                    attachments,
                    createdBy: req.user?._id,
                    postId
                }]
        }) || [];
        if (!comment) {
            if (attachments.length) {
                await (0, s3_config_1.deleteFiles)({
                    urls: attachments
                });
            }
            throw new error_response_1.BadRequest("fail to create this comment");
        }
        return (0, success_response_1.successResponse)({ res, statusCode: 201 });
    };
    updateComment = async (req, res) => {
        const { postId, commentId } = req.params;
        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                allowComments: post_model_1.AllowCommentsEnum.allow,
                $or: [
                    { availability: post_model_1.AvailabilityEnum.public },
                    {
                        availability: post_model_1.AvailabilityEnum.friends,
                        createdBy: { $in: [...(req.user?.friends || []), req.user?._id] }
                    },
                    {
                        availability: post_model_1.AvailabilityEnum.onlyMe,
                        createdBy: req.user?._id
                    },
                    {
                        tags: { $in: [req.user?._id] }
                    }
                ]
            }
        });
        if (!post) {
            throw new error_response_1.notFoundException("no matching post");
        }
        const comment = await this.commentModel.findOne({
            filter: { _id: commentId, postId, createdBy: req.user?._id }
        });
        if (!comment) {
            throw new error_response_1.notFoundException("comment not found or not owned by you");
        }
        if (req.body.tags?.length &&
            (await this.userModel.find({ filter: { _id: { $in: req.body.tags } } })).length !== req.body.tags.length) {
            throw new error_response_1.notFoundException("some of the mentioned users does not exist");
        }
        let attachments = [];
        if (req.files?.length) {
            attachments = await (0, s3_config_1.uploadFiles)({
                storageAppraoch: cloud_multer_1.storageEnum.memory,
                path: `users/${req.user?._id}/post/${post.assetsFolderId}/comment`,
                files: req.files
            });
        }
        const updatedComment = await this.commentModel.findOneAndUpdate({
            filter: { _id: comment._id },
            update: [{
                    $set: {
                        content: req.body.content ?? comment.content,
                        attachments: {
                            $setUnion: [{
                                    $setDifference: ["$attachments", req.body.removedAttachments || []]
                                }, attachments]
                        },
                        tags: {
                            $setUnion: [{
                                    $setDifference: [
                                        "$tags",
                                        req.body.removedTags?.map((tag) => mongoose_1.Types.ObjectId.createFromHexString(tag)) || []
                                    ]
                                },
                                req.body.tags?.map((tag) => mongoose_1.Types.ObjectId.createFromHexString(tag)) || []]
                        }
                    }
                }]
        });
        if (!updatedComment) {
            if (attachments.length) {
                await (0, s3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new error_response_1.BadRequest("fail to update this comment");
        }
        else {
            if (req.body.removedAttachments?.length) {
                await (0, s3_config_1.deleteFiles)({ urls: req.body.removedAttachments });
            }
        }
        return (0, success_response_1.successResponse)({ res });
    };
    createReplyOnComment = async (req, res) => {
        const { postId, commentId } = req.params;
        const comment = await this.commentModel.findOne({
            filter: {
                _id: commentId,
            },
            options: {
                populate: [
                    {
                        path: "postId", match: {
                            $or: [
                                { availability: post_model_1.AvailabilityEnum.public },
                                {
                                    availability: post_model_1.AvailabilityEnum.friends, createdBy: {
                                        $in: [...(req.user?.friends || []), req.user?._id]
                                    }
                                },
                                {
                                    availability: post_model_1.AvailabilityEnum.onlyMe, createdBy: req.user?._id
                                }, {
                                    tags: { $in: [req.user?._id] }
                                }
                            ]
                        }
                    }
                ]
            }
        });
        if (!comment || !comment.postId) {
            throw new error_response_1.notFoundException("no matching post");
        }
        const post = comment.postId;
        if (req.body.tags?.length &&
            (await this.userModel.find({ filter: { _id: { $in: req.body.tags } } })).length !== req.body.tags.length) {
            throw new error_response_1.notFoundException("some of the mentioned users does not exist");
        }
        let attachments = [];
        if (req.files?.length) {
            attachments = await (0, s3_config_1.uploadFiles)({
                storageAppraoch: cloud_multer_1.storageEnum.memory,
                path: `users/${req.user?._id}/post/${post.assetsFolderId}/comment`,
                files: req.files
            });
        }
        const [reply] = await this.commentModel.create({
            data: [{
                    ...req.body,
                    attachments,
                    createdBy: req.user?._id,
                    postId,
                    commentId
                }]
        }) || [];
        if (!reply) {
            if (attachments.length) {
                await (0, s3_config_1.deleteFiles)({
                    urls: attachments
                });
            }
            throw new error_response_1.BadRequest("fail to create this comment");
        }
        return (0, success_response_1.successResponse)({ res, statusCode: 201 });
    };
    getCommentWithReplies = async (req, res) => {
        const { commentId } = req.params;
        const comment = await this.commentModel.findOne({
            filter: { _id: commentId, freezedAt: { $exists: false } },
        });
        if (!comment) {
            throw new error_response_1.notFoundException("comment not found");
        }
        const replies = await this.commentModel.find({
            filter: { commentId: comment._id, freezedAt: { $exists: false } },
        });
        return (0, success_response_1.successResponse)({
            res,
            data: {
                ...comment.toObject(),
                reply: replies,
            },
        });
    };
    freezeComment = async (req, res) => {
        const { commentId } = req.params;
        const comment = await this.commentModel.findOne({
            filter: {
                _id: commentId,
                createdBy: req.user?._id
            }
        });
        if (!comment) {
            throw new error_response_1.notFoundException("comment not found or you are not the owner of this comment");
        }
        const freezedComment = await this.commentModel.updateOne({
            filter: { _id: commentId },
            update: {
                freezedAt: new Date(),
                freezedBy: req.user?._id,
                $add: { __v: 1 },
                $unset: { restoredAt: 1, restoredBy: 1 }
            }
        });
        if (!freezedComment.matchedCount) {
            throw new error_response_1.notFoundException("fail to freeze this comment");
        }
        return (0, success_response_1.successResponse)({ res });
    };
    hardDeleteComment = async (req, res) => {
        const { commentId } = req.params;
        const deletedComment = await this.commentModel.deleteOne({
            filter: {
                _id: commentId,
                createdBy: req.user?._id,
                freezedAt: { $exists: true }
            }
        });
        if (!deletedComment?.deletedCount) {
            throw new error_response_1.notFoundException("comment not found or you are not the owner of this comment");
        }
        return (0, success_response_1.successResponse)({ res });
    };
}
exports.default = new CommentService();
