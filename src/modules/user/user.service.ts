import { Request, Response } from "express";
// import { ILogoutDto } from "./user.dto";
import { UpdateQuery } from "mongoose";
import { HUserDocument, IUser, UserModel } from "../../db/models/user.model";
import { createLoginCredentials, createRevokeToken, LogOutEnum } from "../../utils/security/token.security";
import { userRepository } from "../../db/repository/user.repository";
// import { TokenRepository } from "../../db/repository/token.repository";
// import { TokenModel } from "../../db/models/token.model";
// import { ILogoutDto } from "./user.dto";
import { JwtPayload } from "jsonwebtoken";
import { uploadFile } from "../../utils/multer/s3.config";

class UserService {
    private userModel = new userRepository(UserModel);
    // private tokenModel = new TokenRepository(TokenModel);
    constructor() { }
    profile = async (req: Request, res: Response): Promise<Response> => {
        return res.json({
            message: "user profile", data: {
                user: req.user?._id,
                decoded: req.decoded?.iat
            }
        })
    }


    profileImage = async (req: Request, res: Response): Promise<Response> => {
        const key = await uploadFile({ file: req.file as Express.Multer.File, path: `users/${req.decoded?._id}` })
        return res.json({
            message: "profile-image", data: {
                key
            }
        })
    }


    logout = async (req: Request, res: Response): Promise<Response> => {
        const flag: LogOutEnum = req.body;
        let statusCode: number = 200
        const update: UpdateQuery<IUser> = {};

        switch (flag) {
            case LogOutEnum.all:
                update.changeCredentialsTime = new Date();
                break;
            default:
                await createRevokeToken(req.decoded as JwtPayload);
                statusCode = 201
                break;
        }



        await this.userModel.updateOne({ filter: { _id: req.user?._id }, update });

        return res.status(statusCode).json({
            message: "user profile"
        })
    }

    refreshToken = async (req: Request, res: Response): Promise<Response> => {
        const credentials = await createLoginCredentials(req.user as HUserDocument);
        await createRevokeToken(req.decoded as JwtPayload);
        return res.status(201).json({ message: "done", data: { credentials } })
    }

}


export default new UserService();