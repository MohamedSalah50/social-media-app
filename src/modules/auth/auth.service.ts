import { Request, Response } from "express";
import { ProviderEnum, UserModel } from "../../db/models/user.model";
import { IConfirmEmailInputs, ILoginBodyInputs, IResetForgotCode, ISendForgotCode, ISignupBodyInputs, ISignupWithGmailInputs, IVerifyForgotCode } from "./dto/auth.dto";
import { userRepository } from "../../db/repository/user.repository";
import { BadRequest, conflict, notFoundException } from "../../utils/response/error.response";
import { compareHash, generateHash } from "../../utils/security/hash.security";
import { emailEmitter } from "../../utils/events/email.event";
import { generateOtp } from "../../utils/otp";
import { createLoginCredentials } from "../../utils/security/token.security";
import { OAuth2Client, TokenPayload } from "google-auth-library";


class AuthenticationService {

    private userModel = new userRepository(UserModel);

    private async verifyGmailAccount(idToken: string): Promise<TokenPayload> {
        const client = new OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.WEB_CLIENT_IDS?.split(",") || [],
        })
        const payload = ticket.getPayload();
        if (!payload?.email_verified) {
            throw new BadRequest("fail to  verify this account")
        }
        return payload
    }


    LoginWithGmail = async (req: Request, res: Response): Promise<Response> => {
        const { idToken }: ISignupWithGmailInputs = req.body;
        const { email } = await this.verifyGmailAccount(idToken);
        const user = await this.userModel.findOne({ filter: { email } });

        if (!user) {
            throw new BadRequest("not registered account or registered with another provider")
        }

        const credentials = await createLoginCredentials(user);


        return res.json({ message: "signup successful", data: { credentials } });
    };


    signupWithGmail = async (req: Request, res: Response): Promise<Response> => {
        const { idToken }: ISignupWithGmailInputs = req.body;
        const { email, family_name, given_name, picture } = await this.verifyGmailAccount(idToken);
        const user = await this.userModel.findOne({ filter: { email } });

        if (user) {

            if (user.provider === ProviderEnum.Google) {
                return await this.LoginWithGmail(req, res)
            }
            throw new conflict(`user already exist with another provider ::: ${user.provider}`)
        }

        const [newUser] = await this.userModel.create({
            data: [{
                firstName: given_name as string,
                lastName: family_name as string,
                profileImage: picture as string,
                confirmedAt: new Date(),
            }]
        }) || [];

        if (!newUser) {
            throw new BadRequest("fail to signup with gmail , please try again later")
        }

        const credentials = await createLoginCredentials(newUser);


        return res.json({ message: "signup successful", data: { credentials } });
    };

    signup = async (req: Request, res: Response): Promise<Response> => {

        const { username, email, password }: ISignupBodyInputs = req.body;

        const existUser = await this.userModel.findOne({ filter: { email } });

        if (existUser) {
            throw new conflict("user already exist")
        }

        const otp = generateOtp();

        const [user] = await this.userModel.create({ data: [{ username, email, password: await generateHash(password), confirmEmailOtp: await generateHash(String(otp)) }], options: { validateBeforeSave: true } }) || [];

        emailEmitter.emit("sendConfirmEmail", { to: email, otp })

        return res.status(201).json({ message: "signup successful", data: user });
    };


    login = async (req: Request, res: Response): Promise<Response> => {
        const { email, password }: ILoginBodyInputs = req.body;

        const user = await this.userModel.findOne({ filter: { email } });

        if (!user) {
            throw new notFoundException("user not found")
        }

        if (!user.confirmedAt) {
            throw new BadRequest("email not confirmed, please confirm your email first")
        }

        if (!await compareHash(password, user.password)) {
            throw new notFoundException("in-valid login data")
        }

        const credentials = await createLoginCredentials(user);

        return res.json({ message: "login successful", data: { credentials } });
    }


    confirmEmail = async (req: Request, res: Response): Promise<Response> => {
        const { email, otp }: IConfirmEmailInputs = req.body;

        const user = await this.userModel.findOne({ filter: { email, confirmEmailOtp: { $exists: true }, confirmedAt: { $exists: false } } })

        if (!user) {
            throw new notFoundException("user not found")
        }

        if (!await compareHash(otp, user.confirmEmailOtp as string)) {
            throw new conflict("invalid confirmation code")
        }

        await this.userModel.updateOne({ filter: { email }, update: { confirmedAt: new Date(), $unset: { confirmEmailOtp: 1 } } })

        return res.json({ message: "email confirmed successfully" });
    }


    sendForgotPasword = async (req: Request, res: Response): Promise<Response> => {
        const { email }: ISendForgotCode = req.body;

        const user = await this.userModel.findOne({ filter: { email, provider: ProviderEnum.System, confirmedAt: { $exists: true } } })

        if (!user) {
            throw new notFoundException("invalid account due to one of this reasons: 1 - not registered account 2 - not confirmed account 3 - account provider is not system")
        }

        const otp = generateOtp();
        const result = await this.userModel.updateOne({ filter: { email }, update: { resetPasswordOtp: await generateHash(String(otp)) } })

        if (!result.matchedCount) {
            throw new conflict("fail to send forgot password code, please try again later")
        }

        emailEmitter.emit("forgotPassword", { to: email, otp })

        return res.json({ message: "done" })

    }


    verifyForgotPassword = async (req: Request, res: Response): Promise<Response> => {
        const { email, otp }: IVerifyForgotCode = req.body;

        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: ProviderEnum.System,
                resetPasswordOtp: { $exists: true }
            }
        })

        if (!user) {
            throw new notFoundException("invalid account due to one of this reasons: 1 - not registered account 2 - not confirmed account 3 - account provider is not system 4 - account doesn't have forgot password otp")
        }

        if (!await compareHash(otp, user.resetPasswordOtp as string)) {
            throw new conflict("invalid forgot password code")
        }


        return res.json({ message: "done" })

    }

    resetForgotPassword = async (req: Request, res: Response): Promise<Response> => {
        const { email, otp, password }: IResetForgotCode = req.body;

        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: ProviderEnum.System,
                resetPasswordOtp: { $exists: true }
            }
        })

        if (!user) {
            throw new notFoundException("invalid account due to one of this reasons: 1 - not registered account 2 - not confirmed account 3 - account provider is not system 4 - account doesn't have forgot password otp")
        }

        if (!await compareHash(otp, user.resetPasswordOtp as string)) {
            throw new conflict("invalid forgot password code")
        }

        const result = await this.userModel.updateOne({
            filter: { email },
            update: {
                changeCredentialsTime: new Date(),
                password: await generateHash(password),
                $unset: { resetPasswordOtp: 1 }
            }
        })

        if (!result.matchedCount) {
            throw new conflict("fail to reset password, please try again later")
        }


        return res.json({ message: "done" })

    }

}

export default new AuthenticationService();
