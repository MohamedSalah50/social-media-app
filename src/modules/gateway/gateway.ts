import { connectedSocket, IAuthSocket } from "./gateway.interface";
import { Server } from "socket.io";
import { Server as HttpServer } from "node:http";
import { decodeToken, tokenEnum } from "../../utils/security/token.security";
import { BadRequest } from "../../utils/response/error.response";
import { ChatGateway } from "../chat";
export let io: Server | undefined = undefined;



const chatGateway: ChatGateway = new ChatGateway();
export const initio = async (httpServer: HttpServer) => {
    //initialization socket server
    io = new Server(httpServer, {
        cors: {
            origin: "*",
        },
    });


    //middleware
    io.use(async (socket: IAuthSocket, next) => {
        try {
            const { decoded, user } = await decodeToken({
                authorization: socket.handshake?.auth?.authorization as string,
                tokenType: tokenEnum.access
            })
            socket.credentials = { user, decoded }
            connectedSocket.set(user._id.toString(), socket.id)
            next();
        } catch (error: any) {
            next(error.message)
        }
    })

    //disconection

    function disconnect(socket: IAuthSocket) {
        socket.on("disconnect", () => {
            const removedUserId = socket.credentials?.user?._id?.toString() as string;
            connectedSocket.delete(removedUserId);
            io?.emit("offlineUser", removedUserId)
        })
    }

    io.on("connection", (socket: IAuthSocket) => {
        try {
            console.log(socket.id);
            chatGateway.register(socket, getIO());
            disconnect(socket);
        } catch (error) {
            console.log("fail");
        }
    });

}

export const getIO = () => {
    if (!io) {
        throw new BadRequest("Socket server io is not initialized yet!!!")
    }
    return io
}