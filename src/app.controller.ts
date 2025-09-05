import { config } from "dotenv";
import { resolve } from "node:path";
config({ path: resolve("./config/.env.development") });

import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import cors from "cors";
import authController from "./modules/auth/auth.controller";
import userController from "./modules/user/user.controller"
import {
  // BadRequest,
  globalErrorHandling,
} from "./utils/response/error.response";
import { connectDb } from "./db/connection.db";
// import { promisify } from "node:util";
// import { pipeline } from "node:stream";
// import {
//   createGetSignedLink,
//   // deleteFolderByPrefix,
//   getFile,
// } from "./utils/multer/s3.config";

// const creates3WriteStreamPipe = promisify(pipeline);

const bootstrap = async (): Promise<void> => {
  const port: number | string = process.env.PORT || 5000;
  const app: Express = express();
  app.use(express.json());
  app.use(cors());

  await connectDb();

  app.get("/", (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({ message: "welcome to social app ♥" });
  });

  // app.get("/test", async (req: Request, res: Response) => {
  //   // const { Key } = req.query as { Key: string };
  //   // const result = await deleteFile({ Key });

  //   await deleteFolderByPrefix({ path: "users" });

  //   return res.json({ message: "done", data: {  } });
  // });

  app.use("/auth", authController);
  app.use("/user", userController);
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

  app.use(globalErrorHandling);

  app.listen(port, () => {
    console.log(`app running on port ${port}😊`);
  });
};

export default bootstrap;
