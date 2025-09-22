"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initio = exports.connectedSocket = void 0;
const socket_io_1 = require("socket.io");
const token_security_1 = require("../../utils/security/token.security");
exports.connectedSocket = new Map();
const initio = async (httpServer) => {
    //initialization socket server
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: "*",
        },
    });
    //middleware
    io.use(async (socket, next) => {
        try {
            const { decoded, user } = await (0, token_security_1.decodeToken)({
                authorization: socket.handshake?.auth?.authorization,
                tokenType: token_security_1.tokenEnum.access
            });
            socket.credentials = { user, decoded };
            exports.connectedSocket.set(user._id.toString(), socket.id);
            next();
        }
        catch (error) {
            next(error.message);
        }
    });
    //disconection
    function disconnect(socket) {
        socket.on("disconnect", () => {
            const removedUserId = socket.credentials?.user?._id?.toString();
            exports.connectedSocket.delete(removedUserId);
            io.emit("offlineUser", removedUserId);
        });
    }
    io.on("connection", (socket) => {
        disconnect(socket);
        console.log(socket.id);
    });
};
exports.initio = initio;
