import { config } from "dotenv"
import { resolve } from "node:path"
config({ path: resolve("./config/.env.development") })


import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import cors from "cors";
import authController from "./modules/auth/auth.controller";
import userController from "./modules/user/user.controller";
import { globalErrorHandling } from "./utils/response/error.response";
import { connectDb } from "./db/connection.db";


const bootstrap = async (): Promise<void> => {
    const port: number | string = process.env.PORT || 5000;
    const app: Express = express();
    app.use(express.json());
    app.use(cors());

    await connectDb();

    app.get("/", (req: Request, res: Response, next: NextFunction) => {
        return res.status(200).json({ message: "welcome to social app ♥" })
    })

    app.use("/auth", authController);
    app.use("/user", userController);

    app.use(globalErrorHandling)

    app.listen(port, () => {
        console.log(`app running on port ${port}😊`);
    })
};


export default bootstrap;

