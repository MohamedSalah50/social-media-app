"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const mongoose_1 = require("mongoose");
const repository_1 = require("../../db/repository");
const models_1 = require("../../db/models");
const success_response_1 = require("../../utils/response/success.response");
const gateway_interface_1 = require("../gateway/gateway.interface");
const error_response_1 = require("../../utils/response/error.response");
const uuid_1 = require("uuid");
const s3_config_1 = require("../../utils/multer/s3.config");
class ChatService {
    chatModel = new repository_1.chatRepository(models_1.ChatModel);
    userModel = new repository_1.userRepository(models_1.UserModel);
    constructor() { }
    getChat = async (req, res) => {
        const { userId } = req.params;
        // console.log({ userId });
        const chat = await this.chatModel.findOneChat({
            filter: {
                group: { $exists: false },
                participants: { $all: [mongoose_1.Types.ObjectId.createFromHexString(userId), req.user?._id] }
            },
            page: req.query.page,
            size: req.query.size,
            options: { populate: [{ path: "participants" }] }
        });
        if (!chat) {
            throw new error_response_1.notFoundException("chat not found");
        }
        return (0, success_response_1.successResponse)({ res, data: { chat } });
    };
    getChattingGroup = async (req, res) => {
        const { groupId } = req.params;
        // console.log({ groupId });
        const chat = await this.chatModel.findOneChat({
            filter: {
                _id: mongoose_1.Types.ObjectId.createFromHexString(groupId),
                group: { $exists: true },
                participants: { $in: req.user?._id }
            },
            page: req.query.page,
            size: req.query.size,
            options: {
                populate: [
                    { path: "participants" },
                    { path: "createdBy" },
                    { path: "messages.createdBy" }
                ]
            }
        });
        if (!chat) {
            throw new error_response_1.notFoundException("chat not found");
        }
        return (0, success_response_1.successResponse)({ res, data: chat });
    };
    createChattingGroup = async (req, res) => {
        // const { userId } = req.params as unknown as { userId: string };
        // console.log({ userId });
        const checkParticipants = await this.userModel.find({
            filter: {
                _id: { $in: req.body.participants },
                friends: { $in: req.user?._id }
            }
        });
        if (checkParticipants.length !== req.body.participants.length) {
            throw new error_response_1.notFoundException("fail to find some participants");
        }
        let roomId = req.body.group.replaceAll(/\s+/g, "_") + "_" + (0, uuid_1.v4)();
        let group_image = undefined;
        if (req.file) {
            group_image = await (0, s3_config_1.uploadFile)({
                file: req.file,
                path: `chat/${roomId}`,
            });
        }
        const [chat] = (await this.chatModel.create({
            data: [{
                    createdBy: req.user?._id,
                    group: req.body.group,
                    group_image: group_image,
                    roomId,
                    participants: [...req.body.participants, req.user?._id]
                }]
        })) || [];
        if (!chat) {
            throw new error_response_1.BadRequest("fail to create this group");
        }
        return (0, success_response_1.successResponse)({ res, data: { chat }, statusCode: 201 });
    };
    sayHi = ({ message, socket }) => {
        // console.log({ message });
    };
    sendMessage = async ({ data, socket }) => {
        const { sendTo, content } = data;
        const createdBy = socket.credentials?.user?._id;
        // console.log({ content, sendTo, createdBy });
        const user = await this.userModel.findOne({
            filter: {
                _id: mongoose_1.Types.ObjectId.createFromHexString(sendTo), friends: { $in: createdBy }
            }
        });
        // console.log({ user });
        if (!user) {
            throw new error_response_1.notFoundException("their's no matching friend");
        }
        let chat = undefined;
        chat = await this.chatModel.findOneAndUpdate({
            filter: {
                group: { $exists: false },
                participants: { $all: [mongoose_1.Types.ObjectId.createFromHexString(sendTo), createdBy] }
            },
            update: {
                $addToSet: { messages: { content, createdBy } }
            }
        });
        if (!chat) {
            const [newChat] = (await this.chatModel.create({
                data: [{
                        participants: [mongoose_1.Types.ObjectId.createFromHexString(sendTo), createdBy],
                        createdBy,
                        messages: [{ content, createdBy }]
                    }]
            })) || [];
            if (!newChat) {
                socket.emit("custom_error", "fail to send this message");
            }
        }
        socket.emit("successMessage", { content });
        socket.to(gateway_interface_1.connectedSocket.get(sendTo))
            .emit("newMessage", { content, from: socket.credentials?.user });
    };
    typing = async ({ data, socket }) => {
        const { sendTo } = data;
        const senderId = socket.credentials?.user?._id?.toString();
        const user = await this.userModel.findOne({
            filter: {
                _id: mongoose_1.Types.ObjectId.createFromHexString(sendTo),
                friends: { $in: new mongoose_1.Types.ObjectId(senderId) }
            }
        });
        if (!user) {
            socket.emit("custom_error", { message: "user not in your friend list" });
            return;
        }
        const receiverSocketId = gateway_interface_1.connectedSocket.get(sendTo);
        if (receiverSocketId) {
            socket.to(receiverSocketId).emit("userTyping", {
                from: socket.credentials?.user,
            });
        }
    };
    sendGroupMessage = async ({ data, socket }) => {
        const { groupId, content } = data;
        const createdBy = socket.credentials?.user?._id;
        // console.log({ content, groupId, createdBy });
        const group = await this.chatModel.findOneAndUpdate({
            filter: {
                _id: mongoose_1.Types.ObjectId.createFromHexString(groupId),
                group: { $exists: true },
                participants: { $in: createdBy }
            },
            update: {
                $addToSet: { messages: { content, createdBy } }
            }
        });
        if (!group) {
            throw new error_response_1.notFoundException("fail to find this group");
        }
        socket.emit("successMessage", { content });
        socket.to(group.roomId)
            .emit("newMessage", { content, from: socket.credentials?.user, groupId });
    };
    joinGroupRoom = async ({ data, socket }) => {
        const checkRoom = await this.chatModel.findOne({
            filter: {
                participants: { $in: socket.credentials?.user?._id },
                roomId: data.roomId
            }
        });
        if (!checkRoom) {
            throw new error_response_1.notFoundException("fail to find matching room");
        }
        socket.join(data.roomId);
    };
}
exports.ChatService = ChatService;
