import { Types } from "mongoose";
import { chatRepository, userRepository } from "../../db/repository";
import { ChatModel, UserModel } from "../../db/models";
import { Request, Response } from "express";
import { successResponse } from "../../utils/response/success.response";
import { connectedSocket, IAuthSocket } from "../gateway/gateway.interface";
import { BadRequest, notFoundException } from "../../utils/response/error.response";

import { v4 as uuid } from "uuid";
import { uploadFile } from "../../utils/multer/s3.config";
import { IAMAuth } from "google-auth-library";

export class ChatService {
    private chatModel = new chatRepository(ChatModel);
    private userModel = new userRepository(UserModel);
    constructor() { }



    getChat = async (req: Request, res: Response): Promise<Response> => {

        const { userId } = req.params as unknown as { userId: string };
        // console.log({ userId });


        const chat = await this.chatModel.findOneChat({

            filter: {
                group: { $exists: false },
                participants: { $all: [Types.ObjectId.createFromHexString(userId), req.user?._id] }
            },
            page: req.query.page as unknown as number,
            size: req.query.size as unknown as number,
            options: { populate: [{ path: "participants" }] }
        })

        if (!chat) {
            throw new notFoundException("chat not found")
        }


        return successResponse({ res, data: chat })

    }



    getChattingGroup = async (req: Request, res: Response): Promise<Response> => {

        const { groupId } = req.params as unknown as { groupId: string };

        // console.log({ groupId });

        const chat = await this.chatModel.findOneChat({

            filter: {
                _id: Types.ObjectId.createFromHexString(groupId),
                group: { $exists: true },
                participants: { $in: req.user?._id }
            },
            page: req.query.page as unknown as number,
            size: req.query.size as unknown as number,
            options: {
                populate: [
                    { path: "participants" },
                    { path: "createdBy" },
                    { path: "messages.createdBy" }]
            }
        })

        if (!chat) {
            throw new notFoundException("chat not found")
        }


        return successResponse({ res, data: chat })

    }



    createChattingGroup = async (req: Request, res: Response): Promise<Response> => {

        // const { userId } = req.params as unknown as { userId: string };
        // console.log({ userId });
        const checkParticipants = await this.userModel.find({
            filter: {
                _id: { $in: req.body.participants },
                friends: { $in: req.user?._id }
            }
        })
        if (checkParticipants.length !== req.body.participants.length) {
            throw new notFoundException("fail to find some participants")
        }

        let roomId = req.body.group.replaceAll(/\s+/g, "_") + "_" + uuid();
        let group_image: string | undefined = undefined;

        if (req.file) {
            group_image = await uploadFile({
                file: req.file as Express.Multer.File,
                path: `chat/${roomId}`,
            });
        }


        const [chat] = (await this.chatModel.create({
            data: [{
                createdBy: req.user?._id as Types.ObjectId,
                group: req.body.group,
                group_image: group_image as string,
                roomId,
                participants: [...req.body.participants, req.user?._id]
            }]
        })) || []

        if (!chat) {
            throw new BadRequest("fail to create this group")
        }


        return successResponse({ res, data: { chat }, statusCode: 201 })

    }


    sayHi = ({ message, socket }: { message: string, socket: IAuthSocket }) => {
        // console.log({ message });
    }

    sendMessage = async ({ data, socket }: { data: { sendTo: string, content: string }, socket: IAuthSocket }) => {

        const { sendTo, content } = data;
        const createdBy = socket.credentials?.user?._id as Types.ObjectId;
        // console.log({ content, sendTo, createdBy });

        const user = await this.userModel.findOne({
            filter: {
                _id: Types.ObjectId.createFromHexString(sendTo), friends: { $in: createdBy }
            }
        })

        // console.log({ user });



        if (!user) {
            throw new notFoundException("their's no matching friend")
        }

        let chat = undefined;

        chat = await this.chatModel.findOneAndUpdate({

            filter: {
                group: { $exists: false },
                participants: { $all: [Types.ObjectId.createFromHexString(sendTo), createdBy] }
            },
            update: {
                $addToSet: { messages: { content, createdBy } }
            }
        })

        if (!chat) {
            const [newChat] = (await this.chatModel.create({
                data: [{
                    participants: [Types.ObjectId.createFromHexString(sendTo), createdBy],
                    createdBy,
                    messages: [{ content, createdBy }]
                }]
            })) || []

            if (!newChat) {
                socket.emit("custom_error", "fail to send this message")
            }
        }


        socket.emit("successMessage", { content })

        socket.to(connectedSocket.get(sendTo) as string)
            .emit("newMessage", { content, from: socket.credentials?.user })


    }


    sendGroupMessage = async ({ data, socket }: { data: { groupId: string, content: string }, socket: IAuthSocket }) => {

        const { groupId, content } = data;
        const createdBy = socket.credentials?.user?._id as Types.ObjectId;
        // console.log({ content, groupId, createdBy });

        const group = await this.chatModel.findOneAndUpdate({
            filter: {
                _id: Types.ObjectId.createFromHexString(groupId),
                group: { $exists: true },
                participants: { $in: createdBy }
            },
            update: {
                $addToSet: { messages: { content, createdBy } }
            }
        })

        if (!group) {
            throw new notFoundException("fail to find this group")
        }

        socket.emit("successMessage", { content })

        socket.to(group.roomId as string)
            .emit("newMessage", { content, from: socket.credentials?.user, groupId })


    }



    joinGroupRoom = async ({
        data, socket
    }: {
        data: { roomId: string };
        socket: IAuthSocket
    }) => {
        const checkRoom = await this.chatModel.findOne({
            filter: {
                participants: { $in: socket.credentials?.user?._id },
                roomId: data.roomId
            }
        })
        if (!checkRoom) {
            throw new notFoundException("fail to find matching room")
        }

        socket.join(data.roomId)
    }
}