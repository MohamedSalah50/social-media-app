import { config } from "dotenv";
import { resolve } from "node:path";
config({ path: resolve("./config/.env.development") });

import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import cors from "cors";


import { authRouter, userRouter, postRouter, initio } from "./modules"

import {
  globalErrorHandling,
} from "./utils/response/error.response";
import { connectDb } from "./db/connection.db";
import { chatRouter } from "./modules/chat";







const bootstrap = async (): Promise<void> => {
  const port: number | string = process.env.PORT || 5000;
  const app: Express = express();
  app.use(express.json());
  app.use(cors());


  //dbconnection
  await connectDb();

  app.get("/", (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({ message: "welcome to social app ♥" });
  });



  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/post", postRouter);
  app.use("/chat",chatRouter)

  app.use(globalErrorHandling);


  const httpServer = app.listen(port, () => {
    console.log(`app running on port ${port}😊`);
  });


  initio(httpServer);

};

export default bootstrap;
