"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const node_path_1 = require("node:path");
(0, dotenv_1.config)({ path: (0, node_path_1.resolve)("./config/.env.development") });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const modules_1 = require("./modules");
const error_response_1 = require("./utils/response/error.response");
const connection_db_1 = require("./db/connection.db");
const chat_1 = require("./modules/chat");
const express_2 = require("graphql-http/lib/use/express");
const schema_gql_1 = require("./modules/graphql/schema.gql");
const authentication_middleware_1 = require("./middleware/authentication.middleware");
const bootstrap = async () => {
    const port = process.env.PORT || 5000;
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use((0, cors_1.default)());
    //dbconnection
    await (0, connection_db_1.connectDb)();
    app.all("/graphql", (0, authentication_middleware_1.authentication)(), (0, express_2.createHandler)({
        schema: schema_gql_1.schema,
        context: (req) => ({ user: req.raw.user })
    }));
    app.get("/", (req, res, next) => {
        return res.status(200).json({ message: "welcome to social app ♥" });
    });
    app.use("/auth", modules_1.authRouter);
    app.use("/user", modules_1.userRouter);
    app.use("/post", modules_1.postRouter);
    app.use("/chat", chat_1.chatRouter);
    app.use(error_response_1.globalErrorHandling);
    const httpServer = app.listen(port, () => {
        console.log(`app running on port ${port}😊`);
    });
    (0, modules_1.initio)(httpServer);
};
exports.default = bootstrap;
