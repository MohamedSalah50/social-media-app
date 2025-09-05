import { Request, Response } from "express";
// import { ILogoutDto } from "./user.dto";
import { Types, UpdateQuery } from "mongoose";
import { HUserDocument, IUser, UserModel } from "../../db/models/user.model";
import {
  createLoginCredentials,
  createRevokeToken,
  LogOutEnum,
  RoleEnum,
} from "../../utils/security/token.security";
import { userRepository } from "../../db/repository/user.repository";
// import { TokenRepository } from "../../db/repository/token.repository";
// import { TokenModel } from "../../db/models/token.model";
// import { ILogoutDto } from "./user.dto";
import { JwtPayload } from "jsonwebtoken";
import {
  createSignedUploadLink,
  deleteFiles,
  deleteFolderByPrefix,
  uploadFiles,
} from "../../utils/multer/s3.config";
import { storageEnum } from "../../utils/multer/cloud.multer";
import {
  BadRequest,
  ForbiddenException,
  notFoundException,
  UnAuthorizedException,
} from "../../utils/response/error.response";
import s3event from "../../utils/multer/s3.events";
import { IFreezeAccountDto, IRestoreAccountDto } from "./user.dto";
import { successResponse } from "../../utils/response/success.response";
import { IUserResponse, IProfileImage } from "./user.entities";
import { ILoginResponse } from "../auth/auth.entities";

class UserService {
  private userModel = new userRepository(UserModel);
  // private tokenModel = new TokenRepository(TokenModel);
  constructor() {}
  profile = async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new UnAuthorizedException("missing user details");
    }
    return successResponse<IUserResponse>({
      res,
      data: {
        user: req.user,
      },
    });
  };

  profileImage = async (req: Request, res: Response): Promise<Response> => {
    const {
      contentType,
      originalname,
    }: { contentType: string; originalname: string } = req.body;
    const { url, Key } = await createSignedUploadLink({
      path: `users/${req.decoded?._id}`,
      ContentType: contentType,
      OriginalName: originalname,
    });
    const user = await this.userModel.findByIdAndUpdate({
      id: req.user?._id as Types.ObjectId,
      update: { profileImage: Key, tempProfileImage: req.user?.profileImage },
    });

    if (!user) {
      throw new BadRequest("fail to update user profile image");
    }

    s3event.emit("trackProfileImageUpload", {
      userId: req.user?._id,
      oldKey: req.user?.profileImage,
      Key,
    });

    return successResponse<IProfileImage>({ res, data: { url } });
    // const key = await uploadFile({
    //   file: req.file as Express.Multer.File,
    //   path: `users/${req.decoded?._id}`,
    // });
    // return res.json({
    //   message: "profile-image",
    //   data: {
    //     key,
    //   },
    // });
  };

  profileCoverImage = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const urls = await uploadFiles({
      storageAppraoch: storageEnum.disk,
      files: req.files as Express.Multer.File[],
      path: `users/${req.decoded?._id}/cover`,
    });
    const user = await this.userModel.findByIdAndUpdate({
      id: req.user?._id as Types.ObjectId,
      update: { coverImage: urls },
    });
    if (!user) {
      throw new BadRequest("fail to update user profile cover images");
    }
    if (req.user?.coverImages) {
      await deleteFiles({ urls: req.user?.coverImages });
    }
    return successResponse<IUserResponse>({ res, data: { user } });
  };

  logout = async (req: Request, res: Response): Promise<Response> => {
    const flag: LogOutEnum = req.body;
    let statusCode: number = 200;
    const update: UpdateQuery<IUser> = {};

    switch (flag) {
      case LogOutEnum.all:
        update.changeCredentialsTime = new Date();
        break;
      default:
        await createRevokeToken(req.decoded as JwtPayload);
        statusCode = 201;
        break;
    }

    await this.userModel.updateOne({ filter: { _id: req.user?._id }, update });

    return successResponse({ res });
  };

  refreshToken = async (req: Request, res: Response): Promise<Response> => {
    const credentials = await createLoginCredentials(req.user as HUserDocument);
    await createRevokeToken(req.decoded as JwtPayload);
    return successResponse<ILoginResponse>({ res, data: { credentials } });
  };

  freezeAccount = async (req: Request, res: Response): Promise<Response> => {
    const { userId } = (req.params as IFreezeAccountDto) || {};
    if (userId && req.user?.role !== RoleEnum.admin) {
      throw new ForbiddenException("not authorized user");
    }

    const user = await this.userModel.updateOne({
      filter: { _id: userId || req.user?._id, freezedAt: { $exists: false } },
      update: {
        freezedAt: new Date(),
        freezedBy: req.user?._id,
        changeCredentialsTime: new Date(),
        $unset: { restoredAt: 1, restoredBy: 1 },
      },
    });

    if (!user.matchedCount) {
      throw new notFoundException("user not found or fail to freeze account");
    }

    return successResponse({ res });
  };

  restoreAccount = async (req: Request, res: Response): Promise<Response> => {
    const { userId } = req.params as IRestoreAccountDto;

    const user = await this.userModel.updateOne({
      filter: { _id: userId, freezedAt: { $ne: userId } },
      update: {
        restoredAt: new Date(),
        restoredBy: req.user?._id,
        changeCredentialsTime: new Date(),
        $unset: { freezedAt: 1, freezedBy: 1 },
      },
    });

    if (!user.matchedCount) {
      throw new notFoundException("user not found or fail to restore account");
    }

    return successResponse({ res });
  };

  hardDeleteAccount = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { userId } = req.params as IRestoreAccountDto;

    const user = await this.userModel.deleteOne({
      filter: { _id: userId, freezedAt: { $exists: true } },
    });

    if (!user.deletedCount) {
      throw new notFoundException(
        "user not found or fail to hardDelete account"
      );
    }

    await deleteFolderByPrefix({ path: `users/${userId}` });

    return successResponse({ res });
  };
}

export default new UserService();
