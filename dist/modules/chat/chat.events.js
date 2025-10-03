"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatEvents = void 0;
const chat_service_1 = require("./chat.service");
class ChatEvents {
    chatService;
    constructor() {
        this.chatService = new chat_service_1.ChatService();
    }
    sayHi = (socket, io) => {
        return socket.on("sayHi", (message) => {
            try {
                this.chatService.sayHi({ message, socket });
            }
            catch (error) {
                socket.emit("custom_error", error);
            }
        });
    };
    sendMessage = (socket, io) => {
        return socket.on("sendMessage", (data) => {
            try {
                this.chatService.sendMessage({ data, socket });
            }
            catch (error) {
                socket.emit("custom_error", error);
            }
        });
    };
    typing = (socket, io) => {
        return socket.on("typing", (data) => {
            try {
                this.chatService.typing({ data, socket });
            }
            catch (error) {
                socket.emit("custom_error", error);
            }
        });
    };
    sendGroupMessage = (socket, io) => {
        return socket.on("sendGroupMessage", (data) => {
            try {
                this.chatService.sendGroupMessage({ data, socket });
            }
            catch (error) {
                socket.emit("custom_error", error);
            }
        });
    };
    joinRoom = (socket, io) => {
        return socket.on("join_room", (data) => {
            try {
                this.chatService.joinGroupRoom({ data, socket });
            }
            catch (error) {
                socket.emit("custom_error", error);
            }
        });
    };
}
exports.ChatEvents = ChatEvents;
