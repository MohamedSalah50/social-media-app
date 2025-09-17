import { JwtPayload, Secret, sign, SignOptions, verify } from "jsonwebtoken";
import { HUserDocument, UserModel } from "../../db/models/user.model";
import { BadRequest, UnAuthorizedException } from "../response/error.response";
import { userRepository } from "../../db/repository/user.repository";
import { v4 as uuid } from 'uuid'
import { HTokenDocument, TokenModel } from "../../db/models/token.model";
import { TokenRepository } from "../../db/repository/token.repository";


export enum RoleEnum {
    user = "user",
    admin = "admin",
    superAdmin = "super-admin"
}

export enum SignatureLevelEnum {
    Bearer = "Berear",
    System = "System"
}

export enum tokenEnum {
    access = "access",
    refresh = "refresh"
}

export enum LogOutEnum {
    only = "only",
    all = "all"
}

export const generateToken = async ({ payload,
    secret = process.env.ACCESS_USER_TOKEN_SIGNATURE as string,
    options = { expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN) } }: {
        payload: object,
        secret: Secret,
        options: SignOptions,
    }) => {
    return sign(payload, secret, options);
}

export const verifyToken = async ({
    token,
    secret = process.env.ACCESS_USER_TOKEN_SIGNATURE as string }: {
        token: string,
        secret: Secret,
    }): Promise<JwtPayload> => {
    return verify(token, secret) as JwtPayload;
}

export const detectSignatureLevel = async (role: RoleEnum = RoleEnum.user): Promise<SignatureLevelEnum> => {
    let signatureLevel: SignatureLevelEnum = SignatureLevelEnum.Bearer

    switch (role) {
        case RoleEnum.superAdmin:
        case RoleEnum.admin:
            signatureLevel = SignatureLevelEnum.System
            break;
        default:
            signatureLevel = SignatureLevelEnum.Bearer
            break;
    }
    return signatureLevel
}

export const getSignatures = async (signatureLevel: SignatureLevelEnum = SignatureLevelEnum.Bearer): Promise<{ access_Signature: string, refresh_Signature: string }> => {
    let signatures: { access_Signature: string, refresh_Signature: string } = { access_Signature: "", refresh_Signature: "" }

    switch (signatureLevel) {
        case SignatureLevelEnum.System:
            signatures.access_Signature = process.env.ACCESS_SYSTEM_TOKEN_SIGNATURE as string
            signatures.refresh_Signature = process.env.REFRESH_SYSTEM_TOKEN_SIGNATURE as string
            break;
        default:
            signatures.access_Signature = process.env.ACCESS_USER_TOKEN_SIGNATURE as string
            signatures.refresh_Signature = process.env.REFRESH_USER_TOKEN_SIGNATURE as string
            break;
    }
    return signatures
}


export const createLoginCredentials = async (user: HUserDocument) => {

    const signatureLevel = await detectSignatureLevel(user.role)
    const signatures = await getSignatures(signatureLevel)

    // console.log(signatures);
    const jwtid = uuid();


    const access_Token = await generateToken({
        payload: { _id: user._id },
        secret: signatures.access_Signature,
        options: { expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN), jwtid }
    })
    const refresh_Token = await generateToken({
        payload: { _id: user._id },
        secret: signatures.refresh_Signature,
        options: { expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN), jwtid }
    })

    return { access_Token, refresh_Token }
}


export const decodeToken = async ({ authorization, tokenType = tokenEnum.access }: { authorization: string, tokenType?: tokenEnum }) => {

    const userModel = new userRepository(UserModel);
    const tokenModel = new TokenRepository(TokenModel);
    const [bearerKey, token] = authorization.split(" ");

    if (!bearerKey || !token) {
        throw new UnAuthorizedException("Missing token parts")
    }

    const signatures = await getSignatures(bearerKey as SignatureLevelEnum)
    const decoded = await verifyToken({
        token,
        secret: tokenType === tokenEnum.refresh ?
            signatures.refresh_Signature :
            signatures.access_Signature
    })
    if (!decoded?._id || !decoded?.iat) {
        throw new UnAuthorizedException("Invalid token payload")
    }

    if (await tokenModel.findOne({ filter: { jti: decoded.jti } })) {
        throw new UnAuthorizedException("Invalid or old login credentials")
    }

    const user = await userModel.findOne({ filter: { _id: decoded._id } })
    if (!user) {
        throw new BadRequest("not registered account")
    }

    if ((user.changeCredentialsTime?.getTime() || 0) > decoded.iat * 1000) {
        throw new UnAuthorizedException("Invalid or old login credentials")
    }

    return { user, decoded }
}

export const createRevokeToken = async (decoded: JwtPayload): Promise<HTokenDocument> => {
    const tokenModel = new TokenRepository(TokenModel);
    const [result] = await tokenModel.create({
        data: [{
            jti: decoded.jti as string,
            expiresIn: (decoded.iat as number) + Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
            userId: decoded._id
        }]
    }) || [];
    if (!result) {
        throw new BadRequest("fail to revoke this token")
    }
    return result;
}