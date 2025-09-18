import { Request, Response } from "express";
import { successResponse } from "../../utils/response/success.response";
import { Types } from "mongoose";
import { commentRepository, PostRepository, userRepository } from "../../db/repository";
import { AllowCommentsEnum, AvailabilityEnum, IPost, PostModel } from "../../db/models/post.model";
import { UserModel } from "../../db/models/user.model";
import { CommentModel } from "../../db/models/comment.model";
import { BadRequest, notFoundException } from "../../utils/response/error.response";
import { deleteFiles, uploadFiles } from "../../utils/multer/s3.config";
import { storageEnum } from "../../utils/multer/cloud.multer";

class CommentService {
    private userModel = new userRepository(UserModel);
    private postModel = new PostRepository(PostModel);
    private commentModel = new commentRepository(CommentModel);
    constructor() { }

    createComment = async (req: Request, res: Response): Promise<Response> => {
        const { postId } = req.params as unknown as { postId: Types.ObjectId }

        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                allowComments: AllowCommentsEnum.allow,
                $or: [
                    { availability: AvailabilityEnum.public },
                    {
                        availability: AvailabilityEnum.friends, createdBy: {
                            $in: [...(req.user?.friends || []), req.user?._id]
                        }
                    },
                    {
                        availability: AvailabilityEnum.onlyMe, createdBy: req.user?._id
                    }, {
                        tags: { $in: [req.user?._id] }
                    }
                ]
            }
        })


        if (!post) {
            throw new notFoundException("no matching post")
        }


        if (req.body.tags?.length &&
            (await this.userModel.find({ filter: { _id: { $in: req.body.tags } } })).length !== req.body.tags.length) {
            throw new notFoundException("some of the mentioned users does not exist")
        }

        let attachments: string[] = [];

        if (req.files?.length) {
            attachments = await uploadFiles({
                storageAppraoch: storageEnum.memory,
                path: `users/${req.user?._id}/post/${post.assetsFolderId}/comment`,
                files: req.files as Express.Multer.File[]
            })
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
                await deleteFiles({
                    urls: attachments
                })
            }
            throw new BadRequest("fail to create this comment")
        }

        return successResponse({ res, statusCode: 201 })
    }


    createReplyOnComment = async (req: Request, res: Response): Promise<Response> => {
        const { postId, commentId } = req.params as unknown as { postId: Types.ObjectId, commentId: Types.ObjectId }

        const comment = await this.commentModel.findOne({
            filter: {
                _id: commentId,
            },
            options: {
                populate: [
                    {
                        path: "postId", match: {
                            $or: [
                                { availability: AvailabilityEnum.public },
                                {
                                    availability: AvailabilityEnum.friends, createdBy: {
                                        $in: [...(req.user?.friends || []), req.user?._id]
                                    }
                                },
                                {
                                    availability: AvailabilityEnum.onlyMe, createdBy: req.user?._id
                                }, {
                                    tags: { $in: [req.user?._id] }
                                }
                            ]
                        }
                    }
                ]
            }
        })


        if (!comment || !comment.postId) {
            throw new notFoundException("no matching post")
        }

        const post = comment.postId as IPost;


        if (req.body.tags?.length &&
            (await this.userModel.find({ filter: { _id: { $in: req.body.tags } } })).length !== req.body.tags.length) {
            throw new notFoundException("some of the mentioned users does not exist")
        }

        let attachments: string[] = [];

        if (req.files?.length) {
            attachments = await uploadFiles({
                storageAppraoch: storageEnum.memory,
                path: `users/${req.user?._id}/post/${post.assetsFolderId}/comment`,
                files: req.files as Express.Multer.File[]
            })
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
                await deleteFiles({
                    urls: attachments
                })
            }
            throw new BadRequest("fail to create this comment")
        }

        return successResponse({ res, statusCode: 201 })
    }


    freezeComment = async (req: Request, res: Response): Promise<Response> => {
        const { commentId } = req.params as unknown as { commentId: Types.ObjectId };

        const comment = await this.commentModel.findOne({
            filter: {
                _id: commentId,
                createdBy: req.user?._id
            }
        });

        if (!comment) {
            throw new notFoundException("comment not found or you are not the owner of this comment");
        }

        const freezedComment = await this.commentModel.updateOne({
            filter: { _id: commentId },
            update: {
                freezedAt: new Date(),
                freezedBy: req.user?._id,
                $add: { __v: 1 },
                $unset: { restoredAt: 1, restoredBy: 1 }
            }
        })

        if (!freezedComment.matchedCount) {
            throw new notFoundException("fail to freeze this comment");
        }

        return successResponse({ res });
    }


    hardDeleteComment = async (req: Request, res: Response): Promise<Response> => {
        const { commentId } = req.params as unknown as { commentId: Types.ObjectId };

        const deletedComment = await this.commentModel.deleteOne({
            filter: {
                _id: commentId,
                createdBy: req.user?._id,
                freezedAt: { $exists: true }
            }
        });

        if (!deletedComment?.deletedCount) {
            throw new notFoundException("comment not found or you are not the owner of this comment");
        }

        return successResponse({ res });
    }



}

export default new CommentService();