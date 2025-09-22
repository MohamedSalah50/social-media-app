import { IAuthSocket } from "./gateway.interface";
import { Server } from "socket.io";
import { Server as HttpServer } from "node:http";
import { decodeToken, tokenEnum } from "../../utils/security/token.security";



export const connectedSocket = new Map<string, string>();

export const initio = async (httpServer: HttpServer) => {
    //initialization socket server
    const io = new Server(httpServer, {
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
            io.emit("offlineUser", removedUserId)
        })
    }

    io.on("connection", (socket: IAuthSocket) => {
        disconnect(socket);
        console.log(socket.id);
    });

}

