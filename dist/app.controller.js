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
const auth_controller_1 = __importDefault(require("./modules/auth/auth.controller"));
const user_controller_1 = __importDefault(require("./modules/user/user.controller"));
const error_response_1 = require("./utils/response/error.response");
const connection_db_1 = require("./db/connection.db");
// import { promisify } from "node:util";
// import { pipeline } from "node:stream";
// import {
//   createGetSignedLink,
//   // deleteFolderByPrefix,
//   getFile,
// } from "./utils/multer/s3.config";
// const creates3WriteStreamPipe = promisify(pipeline);
const bootstrap = async () => {
    const port = process.env.PORT || 5000;
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use((0, cors_1.default)());
    await (0, connection_db_1.connectDb)();
    app.get("/", (req, res, next) => {
        return res.status(200).json({ message: "welcome to social app ♥" });
    });
    // app.get("/test", async (req: Request, res: Response) => {
    //   // const { Key } = req.query as { Key: string };
    //   // const result = await deleteFile({ Key });
    //   await deleteFolderByPrefix({ path: "users" });
    //   return res.json({ message: "done", data: {  } });
    // });
    app.use("/auth", auth_controller_1.default);
    app.use("/user", user_controller_1.default);
    // app.get("/upload/pre-signed/*path", async (req: Request, res: Response) => {
    //   const { downloadName, download = "false" } = req.query as {
    //     downloadName?: string;
    //     download?: string;
    //   };
    //   const { path } = req.params as unknown as { path: string[] };
    //   const Key = path.join("/");
    //   const url = await createGetSignedLink({
    //     Key,
    //     downloadName: downloadName as string,
    //     download,
    //   });
    //   return res.json({ message: "done", data: { url } });
    // });
    // app.get("/upload/*path", async (req: Request, res: Response) => {
    //   const { downloadName, download = "false" } = req.query as {
    //     downloadName?: string;
    //     download?: string;
    //   };
    //   const { path } = req.params as unknown as { path: string[] };
    //   const key = path.join("/");
    //   const s3config = await getFile({ key });
    //   if (!s3config?.Body) {
    //     throw new BadRequest("fail to fetch this asset");
    //   }
    //   res.setHeader(
    //     "Content-Type",
    //     `${s3config.ContentType} || application/octet-stream`
    //   );
    //   if (download === "true") {
    //     res.setHeader(
    //       "Content-Disposition",
    //       `attachment; filename=${downloadName || key.split("/").pop()} `
    //     );
    //   }
    //   return await creates3WriteStreamPipe(
    //     s3config.Body as NodeJS.ReadableStream,
    //     res
    //   );
    // });
    app.use(error_response_1.globalErrorHandling);
    app.listen(port, () => {
        console.log(`app running on port ${port}😊`);
    });
};
exports.default = bootstrap;
