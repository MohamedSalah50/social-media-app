"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const chat_events_1 = require("./chat.events");
class ChatGateway {
    chatEvents;
    constructor() {
        this.chatEvents = new chat_events_1.ChatEvents();
    }
    register(socket, io) {
        try {
            this.chatEvents.sayHi(socket, io);
            this.chatEvents.sendMessage(socket, io);
            this.chatEvents.joinRoom(socket, io);
            this.chatEvents.sendGroupMessage(socket, io);
            this.chatEvents.typing(socket, io);
        }
        catch (error) {
            socket.emit("custom_error", error);
        }
    }
}
exports.ChatGateway = ChatGateway;
