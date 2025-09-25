import { Server } from "socket.io";
import { IAuthSocket } from "../gateway";
import { ChatService } from "./chat.service";

export class ChatEvents {
    private chatService: ChatService;
    constructor() {
        this.chatService = new ChatService();
    }
    sayHi = (socket: IAuthSocket, io: Server) => {
        return socket.on("sayHi", (message: string) => {
            try {
                this.chatService.sayHi({ message, socket })
            } catch (error) {
                socket.emit("custom_error", error)
            }
        })
    }

    sendMessage = (socket: IAuthSocket, io: Server) => {
        return socket.on("sendMessage", (data: { sendTo: string, content: string }) => {
            try {
                this.chatService.sendMessage({ data, socket })
            } catch (error) {
                socket.emit("custom_error", error)
            }
        })
    }



    sendGroupMessage = (socket: IAuthSocket, io: Server) => {
        return socket.on("sendGroupMessage", (data: { groupId: string, content: string }) => {
            try {
                this.chatService.sendGroupMessage({ data, socket })
            } catch (error) {
                socket.emit("custom_error", error)
            }
        })
    }

    joinRoom = (socket: IAuthSocket, io: Server) => {
        return socket.on("join_room", (data: { roomId: string }) => {
            try {
                this.chatService.joinGroupRoom({ data, socket })
            } catch (error) {
                socket.emit("custom_error", error)
            }
        })
    }
}