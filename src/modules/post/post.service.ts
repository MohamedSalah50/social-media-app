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
import path from "path";

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
                populate: [{ path: "comments" }]
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
}

export default new PostService();