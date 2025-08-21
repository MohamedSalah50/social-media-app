import { Request, Response } from "express";
import { userModel } from "../../db/models/user.model";
import { compareHash, generateHash } from "../../utils/security/hash.security";
import { generateEncryption } from "../../utils/security/encryption.security";
import { IConfirmEmailInputs, ILoginBodyInputs, ISignupBodyInputs } from "./dto/auth.dto";
import { emailEmitter } from "../../utils/events/email.event";
import { otpEmailTemplate } from "../../utils/email/template.email";
import { AppError } from "../../utils/response/error.response";
import { generateToken } from "../../utils/security/token.security";
// const nanoid = require("nanoid");
// import { nanoid } from "nanoid";

class AuthenticationService {
    signup = async (req: Request, res: Response): Promise<Response> => {

        const { username, email, password, phone }: ISignupBodyInputs = req.body;

        const exsistingUser = await userModel.findOne({ email })

        if (exsistingUser) {
            throw new AppError("user already exists", 400)
        }


        const hashedPassword = generateHash({ plainText: password })
        const encryptedPhone = generateEncryption({ plainText: phone })

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = generateHash({ plainText: otp })

        // const user = await userModel.create({ username, email, password, phone });
        //ال create عماله تجيبلي typeError مش عارف ليه فاستحدمت insertOne , بس هيا شغاله يعني ك logic واليوزر بينضاف عادي ف ال database

        const user = await userModel.insertOne({ username, email, password: hashedPassword, phone: encryptedPhone, confirmHashedOtp: hashedOtp });

        emailEmitter.emit("sendConfirmEmail", { to: email, subject: "confirm your email", html: otpEmailTemplate({ otp, title: "confirm your email" }) });

        return res.status(201).json({ message: "signup successful", data: user });
    };


    login = async (req: Request, res: Response): Promise<Response> => {

        const { email, password }: ILoginBodyInputs = req.body;

        const user = await userModel.findOne({ email });

        if (!user) {
            throw new AppError("user not found", 400)
        }

        if (!user.isEmailVerified) {
            throw new AppError("email not verified , please confirm your email first", 400)
        }

        const matched = await compareHash({ plainText: password, cipherText: user.password })

        if (!matched) {
            throw new AppError("invalid password", 400)
        }

        const accessToken = generateToken({ payload: { id: user._id, email: user.email }, type: "access" })


        const refreshToken = generateToken({ payload: { id: user._id, email: user.email }, type: "refresh" })

        return res.status(200).json({ message: "login successful", data: { accessToken, refreshToken } });
    };


    confirmEmail = async (req: Request, res: Response): Promise<Response> => {
        const { otp, email }: IConfirmEmailInputs = req.body;

        const user = await userModel.findOne({ email })

        if (!user) {
            throw new AppError("user not found", 400)
        }

        const matched = await compareHash({ plainText: otp, cipherText: user.confirmHashedOtp })

        if (!matched) {
            throw new AppError("invalid otp", 400)
        }

        await userModel.updateOne({ email }, { $unset: { confirmHashedOtp: "" }, $set: { isEmailVerified: true } })

        return res.status(200).json({ message: "email confirmed 🎉" });
    }

}

export default new AuthenticationService();
