"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initio = exports.io = void 0;
const gateway_interface_1 = require("./gateway.interface");
const socket_io_1 = require("socket.io");
const token_security_1 = require("../../utils/security/token.security");
const error_response_1 = require("../../utils/response/error.response");
const chat_1 = require("../chat");
exports.io = undefined;
const chatGateway = new chat_1.ChatGateway();
const initio = async (httpServer) => {
    //initialization socket server
    exports.io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: "*",
        },
    });
    //middleware
    exports.io.use(async (socket, next) => {
        try {
            const { decoded, user } = await (0, token_security_1.decodeToken)({
                authorization: socket.handshake?.auth?.authorization,
                tokenType: token_security_1.tokenEnum.access
            });
            socket.credentials = { user, decoded };
            gateway_interface_1.connectedSocket.set(user._id.toString(), socket.id);
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
            gateway_interface_1.connectedSocket.delete(removedUserId);
            exports.io?.emit("offlineUser", removedUserId);
        });
    }
    exports.io.on("connection", (socket) => {
        try {
            console.log(socket.id);
            chatGateway.register(socket, (0, exports.getIO)());
            disconnect(socket);
        }
        catch (error) {
            console.log("fail");
        }
    });
};
exports.initio = initio;
const getIO = () => {
    if (!exports.io) {
        throw new error_response_1.BadRequest("Socket server io is not initialized yet!!!");
    }
    return exports.io;
};
exports.getIO = getIO;
