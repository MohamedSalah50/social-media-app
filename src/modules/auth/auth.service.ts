import { Request, Response } from "express";
import { UserModel } from "../../db/models/user.model";
// import { compareHash, generateHash } from "../../utils/security/hash.security";
// import { generateEncryption } from "../../utils/security/encryption.security";
// import { IConfirmEmailInputs, ILoginBodyInputs, ISignupBodyInputs } from "./dto/auth.dto";
// import { emailEmitter } from "../../utils/events/email.event";
// import { otpEmailTemplate } from "../../utils/email/template.email";
// import { AppError } from "../../utils/response/error.response";
// import { generateToken } from "../../utils/security/token.security";
import { ILoginBodyInputs, ISignupBodyInputs } from "./dto/auth.dto";
import { userRepository } from "../../db/repository/user.repository";
import { AppError, BadRequest, conflict } from "../../utils/response/error.response";
import { compareHash } from "../../utils/security/hash.security";
import { generateToken } from "../../utils/security/token.security";


class AuthenticationService {

    private userModel = new userRepository(UserModel);

    signup = async (req: Request, res: Response): Promise<Response> => {

        const { username, email, password }: ISignupBodyInputs = req.body;

        const existUser = await this.userModel.findOne({ filter: { email } });

        if (existUser) {
            throw new conflict("user already exist")
        }


        // const hashedPassword = generateHash({ plainText: password })

        const [user] = await this.userModel.create({ data: [{ username, email, password }], options: { validateBeforeSave: true } }) || [];

        // emailEmitter.emit("sendConfirmEmail", { to: email, subject: "confirm your email", html: otpEmailTemplate({ otp, title: "confirm your email" }) });

        return res.status(201).json({ message: "signup successful", data: user });
    };


    login = async (req: Request, res: Response): Promise<Response> => {

        const { email, password }: ILoginBodyInputs = req.body;

        const user = await this.userModel.findOne({ filter: { email } });

        if (!user) {
            throw new BadRequest("user not found")
        }

        if (!user.confirmedAt) {
            throw new BadRequest("email not verified , please confirm your email first")
        }

        const matched = await compareHash({ plainText: password, cipherText: user.password })

        if (!matched) {
            throw new AppError("invalid password", 400)
        }

        const accessToken = generateToken({ payload: { id: user._id, email: user.email }, type: "access" })


        const refreshToken = generateToken({ payload: { id: user._id, email: user.email }, type: "refresh" })

        return res.status(200).json({ message: "login successful", data: { accessToken, refreshToken } });
    };


    // confirmEmail = async (req: Request, res: Response): Promise<Response> => {
    //     const { otp, email }: IConfirmEmailInputs = req.body;

    //     const user = await this.userModel.findOne({ filter: { email } });

    //     if (!user) {
    //         throw new BadRequest("user not found")
    //     }

    //     const matched = await compareHash({ plainText: otp, cipherText: user.confirmHashedOtp })

    //     if (!matched) {
    //         throw new AppError("invalid otp", 400)
    //     }

    //     await this.userModel.updateOne({ email }, { $unset: { confirmHashedOtp: "" }, $set: { isEmailVerified: true } })

    //     return res.status(200).json({ message: "email confirmed 🎉" });
    // }

}

export default new AuthenticationService();
