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
  conflict,
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
import { FriendRequestRepository, PostRepository } from "../../db/repository";
import { PostModel } from "../../db/models/post.model";
import { FilterQuery } from "mongoose";
import { FriendRequestModel } from "../../db/models/friendRequest.model";

class UserService {
  private userModel = new userRepository(UserModel);
  private postModel = new PostRepository(PostModel);
  private friendRequestModel = new FriendRequestRepository(FriendRequestModel);
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


  sendFriendRequest = async (req: Request, res: Response): Promise<Response> => {

    const { userId } = req.params as unknown as { userId: Types.ObjectId };

    const checkUserExist = await this.userModel.findOne({
      filter: {
        _id: userId,
        blocked: { $nin: req.user?._id }
      }
    })

    if (!checkUserExist) {
      throw new notFoundException("user not found")
    }

    const checkRequestExist = await this.friendRequestModel.findOne({
      filter: {
        createdBy: req.user?._id,
        sendTo: userId,
        acceptedAt: { $exists: false }
      }
    })

    if (checkRequestExist) {
      throw new conflict("request already sent to the target")
    }

    const [friendRequest] = await this.friendRequestModel.create({
      data: [
        {
          createdBy: req.user?._id as Types.ObjectId,
          sendTo: userId
        }
      ]
    }) || []

    if (!friendRequest) {
      throw new BadRequest("fail to send friend request")
    }

    return successResponse<IUserResponse>({
      res,
      data: {
        user: req.user as Partial<HUserDocument>,
      },
    });
  };


  acceptFriendRequest = async (req: Request, res: Response): Promise<Response> => {

    const { requestId } = req.params as unknown as { requestId: Types.ObjectId };


    const friendRequest = await this.friendRequestModel.findOneAndUpdate({
      filter: {
        _id: requestId,
        sendTo: req.user?._id,
        acceptedAt: { $exists: false }
      },
      update: {
        acceptedAt: new Date()
      }
    })

    if (!friendRequest) {
      throw new conflict("request not found")
    }


    await Promise.all([
      this.userModel.updateOne({
        filter: { _id: friendRequest.sendTo },
        update: {
          $addToSet: {
            friends: friendRequest.createdBy
          }
        }
      }),
      this.userModel.updateOne({
        filter: { _id: friendRequest.createdBy },
        update: {
          $addToSet: {
            friends: friendRequest.sendTo
          }
        }
      })
    ])


    return successResponse<IUserResponse>({
      res,
      data: {
        user: req.user as Partial<HUserDocument>,
      },
    });
  };


  deleteFriendRequest = async (req: Request, res: Response): Promise<Response> => {

    const { requestId } = req.params as unknown as { requestId: Types.ObjectId };

    const deleteRequest = await this.friendRequestModel.deleteOne({
      filter: {
        createdBy: req.user?._id,
        sendTo: requestId,
        acceptedAt: { $exists: false }
      }
    })
    if (!deleteRequest.deletedCount) {
      throw new BadRequest("fail to delete friend request")
    }
    return successResponse({ res, message: "friend request deleted" })
  }


  dashboard = async (req: Request, res: Response): Promise<Response> => {


    const result = await Promise.allSettled([
      this.postModel.find({ filter: {} }),
      this.userModel.find({ filter: {} })
    ])
    return successResponse({ res, data: { result } });
  };

  changeRole = async (req: Request, res: Response): Promise<Response> => {
    const { userId } = req.params as unknown as { userId: Types.ObjectId };
    const { role } = req.body as { role: RoleEnum };
    const currentAdminLevel = req.user?.role as RoleEnum;

    const filter: FilterQuery<HUserDocument> = {
      _id: userId,
      role: {
        $nin: [
          RoleEnum.superAdmin,
          currentAdminLevel == RoleEnum.admin ? currentAdminLevel : undefined
        ]
      }
    }
    const update = { role };

    const user = await this.userModel.updateOne({
      filter,
      update,
    });
    if (!user.matchedCount) {
      throw new notFoundException("user not found")
    }
    return successResponse({ res });
  }


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

    const { newEmail }: IUpdateEmailDto = req.body;

    //check if newEmail exsists in all userCollection
    if (await this.userModel.findOne({ filter: { email: newEmail } })) {
      throw new BadRequest("email already exsists , please change to another email")
    }

    const user = await this.userModel.findOne({ filter: { email: req.user?.email } });



    const oldOtp = generateOtp();
    const newOtp = generateOtp();
    console.log(oldOtp);
    console.log(newOtp);


    await this.userModel.findOneAndUpdate({
      filter: { email: req.user?.email },
      update: {
        tempEmail: newEmail,
        oldEmailOtp: await generateHash(String(oldOtp)),
        newEmailOtp: await generateHash(String(newOtp))
      },
    })

    emailEmitter.emit("sendConfirmEmail", { to: user?.email, otp: oldOtp });
    emailEmitter.emit("sendConfirmEmail", { to: newEmail, otp: newOtp });


    return successResponse({ res, message: "otp sent , please confirm your new email" })
  }

  confirmUpdateEmail = async (req: Request, res: Response) => {

    const { newOtp, oldOtp }: IConfirmUpdateEmail = req.body;

    const user = await this.userModel.findOne({ filter: { email: req.user?.email } })

    if (!user?.tempEmail || (!user?.oldEmailOtp && !user?.newEmailOtp)) {
      throw new BadRequest("there's no pending email request")
    }

    if (!await compareHash(oldOtp, user.oldEmailOtp as string)) {
      throw new BadRequest("otps not match")
    }

    if (!await compareHash(newOtp, user.newEmailOtp as string)) {
      throw new BadRequest("otps not match")
    }

    await this.userModel.findOneAndUpdate({
      filter: { email: req.user?.email },
      update: {
        email: user.tempEmail, changeCredentialsTime: Date.now(),
        $unset: { tempEmail: 1, oldEmailOtp: 1, newEmailOtp: 1 }, $inc: { __v: 1 }
      }
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
