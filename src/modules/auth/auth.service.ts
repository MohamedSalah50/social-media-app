import { Request, Response } from "express";
import { UserModel } from "../../db/models/user.model";
import { IConfirmEmailInputs, ILoginBodyInputs, ISignupBodyInputs } from "./dto/auth.dto";
import { userRepository } from "../../db/repository/user.repository";
import { AppError, BadRequest, conflict, notFoundException } from "../../utils/response/error.response";
import { compareHash, generateHash } from "../../utils/security/hash.security";
import { generateToken } from "../../utils/security/token.security";
import { emailEmitter } from "../../utils/events/email.event";
import { generateOtp } from "../../utils/otp";


class AuthenticationService {

    private userModel = new userRepository(UserModel);

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
            throw new BadRequest("user not found")
        }

        if (!user.confirmedAt) {
            throw new BadRequest("email not verified , please confirm your email first")
        }

        const matched = await compareHash(password, user.password)

        if (!matched) {
            throw new AppError("invalid password", 400)
        }

        const accessToken = generateToken({ payload: { id: user._id, email: user.email }, type: "access" })


        const refreshToken = generateToken({ payload: { id: user._id, email: user.email }, type: "refresh" })

        return res.status(200).json({ message: "login successful", data: { accessToken, refreshToken } });
    };


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



}

export default new AuthenticationService();
