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
import { IConfirmUpdateEmail, IFreezeAccountDto, IRestoreAccountDto, ITwofaEnapleVerifyDto, IUpdateEmailDto, IUpdatePasswordDto } from "./user.dto";
import { successResponse } from "../../utils/response/success.response";
import { IUserResponse, IProfileImage } from "./user.entities";
import { ILoginResponse } from "../auth/auth.entities";
import { decryptEncryption, generateEncryption } from "../../utils/security/encryption.security";
import { compareHash, generateHash } from "../../utils/security/hash.security";
import { generateOtp } from "../../utils/otp";
import { emailEmitter } from "../../utils/events/email.event";

class UserService {
  private userModel = new userRepository(UserModel);
  // private tokenModel = new TokenRepository(TokenModel);
  constructor() { }
  profile = async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new UnAuthorizedException("missing user details");
    }

    req.user.phone = decryptEncryption({ cipherText: req.user.phone });
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


  updateBasicInfo = async (req: Request, res: Response) => {

    if (req.body.phone) {
      req.body.phone = await generateEncryption({ plainText: req.body.phone });
    }
    const user = await this.userModel.findOneAndUpdate({
      filter: { _id: req?.user?._id },
      update: req.body,
    })

    if (!user) {
      throw new notFoundException("user not found")
    }

    return successResponse({ res })
  }


  updatePassword = async (req: Request, res: Response) => {

    const { oldPassword, password }: IUpdatePasswordDto = req.body;

    if (!await compareHash(oldPassword, req?.user?.password as string)) {
      throw new BadRequest("old password not match")
    }

    const user = await this.userModel.findOneAndUpdate({
      filter: { _id: req?.user?._id },
      update: { password: await generateHash(password), changeCredentialsTime: Date.now() },
    })

    if (!user) {
      throw new notFoundException("user not found")
    }

    return successResponse({ res, message: "password updated suuccessfully" })
  }


  updateEmail = async (req: Request, res: Response) => {

    const { oldEmail, email }: IUpdateEmailDto = req.body;

    //handled in validation
    if (email === oldEmail) {
      throw new BadRequest("email is same as old email")
    }

    const otp = generateOtp();
    console.log(otp);


    await this.userModel.findOneAndUpdate({
      filter: { _id: req?.user?._id },
      update: { tempEmail: email, tempEmailOtp: await generateHash(String(otp)) }
    })

    emailEmitter.emit("sendConfirmEmail", { to: email, otp });


    return successResponse({ res, message: "otp sent , please confirm your new email" })
  }

  confirmUpdateEmail = async (req: Request, res: Response) => {

    const { otp }: IConfirmUpdateEmail = req.body;

    const user = await this.userModel.findOne({ filter: { _id: req.user?._id } })

    if (!user?.tempEmail || !user?.tempEmailOtp) {
      throw new BadRequest("there's no pending email request")
    }

    if (!await compareHash(otp, user.tempEmailOtp)) {
      throw new BadRequest("otp not match")
    }

    await this.userModel.findOneAndUpdate({
      filter: { _id: req.user?._id },
      update: { email: user.tempEmail, changeCredentialsTime: Date.now(), $unset: { tempEmail: 1, tempEmailOtp: 1 }, $inc: { __v: 1 } }
    })

    return successResponse({ res, message: "email updated successfully,please login again" })
  }


  twoFaEnapleRequest = async (req: Request, res: Response) => {

    const user = await this.userModel.findOne({ filter: { _id: req.user?._id } })

    const otp = generateOtp();

    await this.userModel.updateOne({
      filter: { _id: req.user?._id },
      update: { temp2faOtp: await generateHash(String(otp)) }
    })

    emailEmitter.emit("sendConfirmEmail", { to: user?.email, otp });

    return successResponse({ res, message: "otp sent , please confirm your email 2fa" })
  }

  twoFaEnapleConfirm = async (req: Request, res: Response) => {
    const { otp }: ITwofaEnapleVerifyDto = req.body;

    const user = await this.userModel.findOne({ filter: { _id: req.user?._id } })

    if (!await compareHash(otp, user?.temp2faOtp as string)) {
      throw new BadRequest("otp mismatch")
    }

    await this.userModel.findOneAndUpdate({
      filter: { _id: req.user?._id },
      update: { is2faEnabled: true, $unset: { temp2faOtp: 1 }, $inc: { __v: 1 } }
    })

    return successResponse({ res, message: "2fa enabled successfully" })

  }


}

export default new UserService();
