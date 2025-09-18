"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const success_response_1 = require("../../utils/response/success.response");
const repository_1 = require("../../db/repository");
const user_model_1 = require("../../db/models/user.model");
const post_model_1 = require("../../db/models/post.model");
const error_response_1 = require("../../utils/response/error.response");
const uuid_1 = require("uuid");
const s3_config_1 = require("../../utils/multer/s3.config");
const mongoose_1 = require("mongoose");
class PostService {
    userModel = new repository_1.userRepository(user_model_1.UserModel);
    postModel = new repository_1.PostRepository(post_model_1.PostModel);
    constructor() { }
    postList = async (req, res) => {
        const { page, size } = req.query;
        const posts = await this.postModel.paginate({
            filter: {
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
            },
            page,
            size,
            options: {
                populate: [{
                        path: "comments",
                        match: { commentId: { $exists: false } },
                        populate: [{ path: "reply", justOne: true }]
                    }]
            }
        });
        return (0, success_response_1.successResponse)({ res, data: { posts, count: posts.length } });
    };
    getPostById = async (req, res) => {
        const { postId } = req.params;
        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                freezedAt: { $exists: false },
                $or: [
                    { availability: post_model_1.AvailabilityEnum.public },
                    {
                        availability: post_model_1.AvailabilityEnum.friends,
                        createdBy: { $in: [...(req.user?.friends || []), req.user?._id] }
                    },
                    { availability: post_model_1.AvailabilityEnum.onlyMe, createdBy: req.user?._id },
                    { tags: { $in: [req.user?._id] } }
                ]
            },
        });
        if (!post) {
            throw new error_response_1.notFoundException("post not found");
        }
        return (0, success_response_1.successResponse)({ res, data: post });
    };
    createPost = async (req, res) => {
        if (req.body.tags?.length &&
            (await this.userModel.find({ filter: { _id: { $in: req.body.tags } } })).length !== req.body.tags.length) {
            throw new error_response_1.notFoundException("some of the mentioned users does not exist");
        }
        let attachments = [];
        let assetsFolderId = (0, uuid_1.v4)();
        if (req.files?.length) {
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${req.user?._id}/post/${assetsFolderId}`
            });
        }
        const [post] = await this.postModel.create({
            data: [{
                    ...req.body,
                    attachments,
                    assetsFolderId,
                    createdBy: req.user?._id
                }]
        }) || [];
        if (!post) {
            if (attachments.length) {
                await (0, s3_config_1.deleteFiles)({
                    urls: attachments
                });
            }
            throw new error_response_1.BadRequest("fail to create this post");
        }
        return (0, success_response_1.successResponse)({ res, statusCode: 201 });
    };
    updatePost = async (req, res) => {
        const post = await this.postModel.findOne({
            filter: { _id: req.params.postId, createdBy: req.user?._id },
        });
        if (!post) {
            throw new error_response_1.notFoundException("post not found");
        }
        if (req.body.tags?.length &&
            (await this.userModel.find({ filter: { _id: { $in: req.body.tags } } })).length !== req.body.tags.length) {
            throw new error_response_1.notFoundException("some of the mentioned users does not exist");
        }
        let attachments = [];
        // let assetsFolderId: string = uuid();
        if (req.files?.length) {
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${req.user?._id}/post/${post.assetsFolderId}`
            });
        }
        const updatedPost = await this.postModel.findOneAndUpdate({
            filter: { _id: post._id },
            update: [{
                    $set: {
                        content: req.body.content,
                        allowComments: req.body.allowComments || post.allowComments,
                        availability: req.body.availability || post.availability,
                        attachments: {
                            $setUnion: [{
                                    $setDifference: ["$attachments", req.body.removedAttachments || []]
                                }, attachments]
                        },
                        tags: {
                            $setUnion: [{
                                    $setDifference: ["$tags", req.body.removedTags?.map((tag) => { return mongoose_1.Types.ObjectId.createFromHexString(tag); }) || []]
                                },
                                req.body.tags?.map((tag) => { return mongoose_1.Types.ObjectId.createFromHexString(tag); }) || []]
                        },
                    }
                }]
        });
        if (!updatedPost) {
            if (attachments.length) {
                await (0, s3_config_1.deleteFiles)({
                    urls: attachments
                });
            }
            throw new error_response_1.BadRequest("fail to update this post");
        }
        else {
            if (req.body.removedAttachments?.length) {
                await (0, s3_config_1.deleteFiles)({
                    urls: req.body.removedAttachments
                });
            }
        }
        return (0, success_response_1.successResponse)({ res });
    };
    likePost = async (req, res) => {
        const { postId } = req.params;
        const { action } = req.query;
        let update = { $addToSet: { likes: req.user?._id } };
        if (action === post_model_1.likeActionEnum.unlike) {
            update = { $pull: { likes: req.user?._id } };
        }
        const post = await this.postModel.findOneAndUpdate({
            filter: { _id: postId },
            update,
        });
        if (!post) {
            throw new error_response_1.notFoundException("post not found or invalid postId");
        }
        return (0, success_response_1.successResponse)({ res });
    };
    freezePost = async (req, res) => {
        const { postId } = req.params;
        const post = await this.postModel.findOne({
            filter: { _id: postId, createdBy: req.user?._id }
        });
        if (!post) {
            throw new error_response_1.notFoundException("post not found or you are not the owner of this post");
        }
        const freezedPost = await this.postModel.updateOne({
            filter: { _id: postId },
            update: {
                freezedAt: new Date(),
                freezedBy: req.user?._id,
                $add: { __v: 1 },
                $unset: { restoredAt: 1, restoredBy: 1 },
            }
        });
        if (!freezedPost.matchedCount) {
            throw new error_response_1.notFoundException("fail to freeze this post");
        }
        return (0, success_response_1.successResponse)({ res });
    };
    hardDeletePost = async (req, res) => {
        const { postId } = req.params;
        const deletedPost = await this.postModel.deleteOne({
            filter: { _id: postId, createdBy: req.user?._id, freezedAt: { $exists: true } },
        });
        if (!deletedPost) {
            throw new error_response_1.notFoundException("post not found or you are not the owner of this post");
        }
        if (!deletedPost.deletedCount) {
            throw new error_response_1.notFoundException("fail to delete this post");
        }
        return (0, success_response_1.successResponse)({ res });
    };
}
exports.default = new PostService();
