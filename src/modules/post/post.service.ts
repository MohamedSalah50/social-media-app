import { Request, Response } from "express";
import { successResponse } from "../../utils/response/success.response";
import { PostRepository, userRepository } from "../../db/repository";
import { UserModel } from "../../db/models/user.model";
import { AvailabilityEnum, HPostDocument, likeActionEnum, PostModel } from "../../db/models/post.model";
import { BadRequest, notFoundException } from "../../utils/response/error.response";
import { v4 as uuid } from "uuid";
import { deleteFiles, uploadFiles } from "../../utils/multer/s3.config";
import { LikePostQueryInputsDto } from "./post.dto";
import { Types, UpdateQuery } from "mongoose";

class PostService {
    private userModel = new userRepository(UserModel);
    private postModel = new PostRepository(PostModel);
    constructor() { }



    postList = async (req: Request, res: Response): Promise<Response> => {

        const { page, size } = req.query as unknown as { page: number, size: number }
        const posts = await this.postModel.paginate({
            filter: {
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
        })

        return successResponse({ res, data: { posts, count: posts.length } })
    }


    createPost = async (req: Request, res: Response): Promise<Response> => {
        if (req.body.tags?.length &&
            (await this.userModel.find({ filter: { _id: { $in: req.body.tags } } })).length !== req.body.tags.length) {
            throw new notFoundException("some of the mentioned users does not exist")
        }

        let attachments: string[] = [];
        let assetsFolderId: string = uuid();

        if (req.files?.length) {
            attachments = await uploadFiles({
                files: req.files as Express.Multer.File[],
                path: `users/${req.user?._id}/post/${assetsFolderId}`
            })
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
                await deleteFiles({
                    urls: attachments
                })
            }
            throw new BadRequest("fail to create this post")
        }

        return successResponse({ res, statusCode: 201 })
    }


    updatePost = async (req: Request, res: Response): Promise<Response> => {

        const post = await this.postModel.findOne({
            filter: { _id: req.params.postId, createdBy: req.user?._id },

        })

        if (!post) {
            throw new notFoundException("post not found")
        }

        if (req.body.tags?.length &&
            (await this.userModel.find({ filter: { _id: { $in: req.body.tags } } })).length !== req.body.tags.length) {
            throw new notFoundException("some of the mentioned users does not exist")
        }

        let attachments: string[] = [];
        // let assetsFolderId: string = uuid();

        if (req.files?.length) {
            attachments = await uploadFiles({
                files: req.files as Express.Multer.File[],
                path: `users/${req.user?._id}/post/${post.assetsFolderId}`
            })
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
                            $setDifference: ["$tags", req.body.removedTags?.map((tag: string) => { return Types.ObjectId.createFromHexString(tag) }) || []]
                        },
                        req.body.tags?.map((tag: string) => { return Types.ObjectId.createFromHexString(tag) }) || []]
                    },
                }
            }]
        })

        if (!updatedPost) {
            if (attachments.length) {
                await deleteFiles({
                    urls: attachments
                })
            }
            throw new BadRequest("fail to update this post")
        } else {
            if (req.body.removedAttachments?.length) {
                await deleteFiles({
                    urls: req.body.removedAttachments
                })
            }
        }

        return successResponse({ res })
    }


    likePost = async (req: Request, res: Response): Promise<Response> => {
        const { postId } = req.params as { postId: string };
        const { action } = req.query as LikePostQueryInputsDto;

        let update: UpdateQuery<HPostDocument> = { $addToSet: { likes: req.user?._id } }

        if (action === likeActionEnum.unlike) {
            update = { $pull: { likes: req.user?._id } }
        }

        const post = await this.postModel.findOneAndUpdate({
            filter: { _id: postId },
            update,
        })

        if (!post) {
            throw new notFoundException("post not found or invalid postId")
        }

        return successResponse({ res })
    }


    freezePost = async (req: Request, res: Response): Promise<Response> => {
        const { postId } = req.params as unknown as { postId: Types.ObjectId };

        const post = await this.postModel.findOne({
            filter: { _id: postId, createdBy: req.user?._id }
        })

        if (!post) {
            throw new notFoundException("post not found or you are not the owner of this post")
        }

        const freezedPost = await this.postModel.updateOne({
            filter: { _id: postId },
            update: {
                freezedAt: new Date(),
                freezedBy: req.user?._id,
                $add: { __v: 1 },
                $unset: { restoredAt: 1, restoredBy: 1 },
            }
        })

        if (!freezedPost.matchedCount) {
            throw new notFoundException("fail to freeze this post")
        }

        return successResponse({ res })
    }


    hardDeletePost = async (req: Request, res: Response): Promise<Response> => {
        const { postId } = req.params as unknown as { postId: Types.ObjectId };


        const deletedPost = await this.postModel.deleteOne({
            filter: { _id: postId, createdBy: req.user?._id , freezedAt: { $exists: true } },
        })

        if (!deletedPost) {
            throw new notFoundException("post not found or you are not the owner of this post")
        }

        if (!deletedPost.deletedCount) {
            throw new notFoundException("fail to delete this post")
        }



        return successResponse({ res })
    }

}

export default new PostService();