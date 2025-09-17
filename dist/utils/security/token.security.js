"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRevokeToken = exports.decodeToken = exports.createLoginCredentials = exports.getSignatures = exports.detectSignatureLevel = exports.verifyToken = exports.generateToken = exports.LogOutEnum = exports.tokenEnum = exports.SignatureLevelEnum = exports.RoleEnum = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const user_model_1 = require("../../db/models/user.model");
const error_response_1 = require("../response/error.response");
const user_repository_1 = require("../../db/repository/user.repository");
const uuid_1 = require("uuid");
const token_model_1 = require("../../db/models/token.model");
const token_repository_1 = require("../../db/repository/token.repository");
var RoleEnum;
(function (RoleEnum) {
    RoleEnum["user"] = "user";
    RoleEnum["admin"] = "admin";
    RoleEnum["superAdmin"] = "super-admin";
})(RoleEnum || (exports.RoleEnum = RoleEnum = {}));
var SignatureLevelEnum;
(function (SignatureLevelEnum) {
    SignatureLevelEnum["Bearer"] = "Berear";
    SignatureLevelEnum["System"] = "system";
})(SignatureLevelEnum || (exports.SignatureLevelEnum = SignatureLevelEnum = {}));
var tokenEnum;
(function (tokenEnum) {
    tokenEnum["access"] = "access";
    tokenEnum["refresh"] = "refresh";
})(tokenEnum || (exports.tokenEnum = tokenEnum = {}));
var LogOutEnum;
(function (LogOutEnum) {
    LogOutEnum["only"] = "only";
    LogOutEnum["all"] = "all";
})(LogOutEnum || (exports.LogOutEnum = LogOutEnum = {}));
const generateToken = async ({ payload, secret = process.env.ACCESS_USER_TOKEN_SIGNATURE, options = { expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN) } }) => {
    return (0, jsonwebtoken_1.sign)(payload, secret, options);
};
exports.generateToken = generateToken;
const verifyToken = async ({ token, secret = process.env.ACCESS_USER_TOKEN_SIGNATURE }) => {
    return (0, jsonwebtoken_1.verify)(token, secret);
};
exports.verifyToken = verifyToken;
const detectSignatureLevel = async (role = RoleEnum.user) => {
    let signatureLevel = SignatureLevelEnum.Bearer;
    switch (role) {
        case RoleEnum.superAdmin:
        case RoleEnum.admin:
            signatureLevel = SignatureLevelEnum.System;
            break;
        default:
            signatureLevel = SignatureLevelEnum.Bearer;
            break;
    }
    return signatureLevel;
};
exports.detectSignatureLevel = detectSignatureLevel;
const getSignatures = async (signatureLevel = SignatureLevelEnum.Bearer) => {
    let signatures = { access_Signature: "", refresh_Signature: "" };
    switch (signatureLevel) {
        case SignatureLevelEnum.System:
            signatures.access_Signature = process.env.ACCESS_SYSTEM_TOKEN_SIGNATURE;
            signatures.refresh_Signature = process.env.REFRESH_SYSTEM_TOKEN_SIGNATURE;
            break;
        default:
            signatures.access_Signature = process.env.ACCESS_USER_TOKEN_SIGNATURE;
            signatures.refresh_Signature = process.env.REFRESH_USER_TOKEN_SIGNATURE;
            break;
    }
    return signatures;
};
exports.getSignatures = getSignatures;
const createLoginCredentials = async (user) => {
    const signatureLevel = await (0, exports.detectSignatureLevel)(user.role);
    const signatures = await (0, exports.getSignatures)(signatureLevel);
    // console.log(signatures);
    const jwtid = (0, uuid_1.v4)();
    const access_Token = await (0, exports.generateToken)({
        payload: { _id: user._id },
        secret: signatures.access_Signature,
        options: { expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN), jwtid }
    });
    const refresh_Token = await (0, exports.generateToken)({
        payload: { _id: user._id },
        secret: signatures.refresh_Signature,
        options: { expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN), jwtid }
    });
    return { access_Token, refresh_Token };
};
exports.createLoginCredentials = createLoginCredentials;
const decodeToken = async ({ authorization, tokenType = tokenEnum.access }) => {
    const userModel = new user_repository_1.userRepository(user_model_1.UserModel);
    const tokenModel = new token_repository_1.TokenRepository(token_model_1.TokenModel);
    const [bearerKey, token] = authorization.split(" ");
    if (!bearerKey || !token) {
        throw new error_response_1.UnAuthorizedException("Missing token parts");
    }
    const signatures = await (0, exports.getSignatures)(bearerKey);
    const decoded = await (0, exports.verifyToken)({
        token,
        secret: tokenType === tokenEnum.refresh ?
            signatures.refresh_Signature :
            signatures.access_Signature
    });
    if (!decoded?._id || !decoded?.iat) {
        throw new error_response_1.UnAuthorizedException("Invalid token payload");
    }
    if (await tokenModel.findOne({ filter: { jti: decoded.jti } })) {
        throw new error_response_1.UnAuthorizedException("Invalid or old login credentials");
    }
    const user = await userModel.findOne({ filter: { _id: decoded._id } });
    if (!user) {
        throw new error_response_1.BadRequest("not registered account");
    }
    if ((user.changeCredentialsTime?.getTime() || 0) > decoded.iat * 1000) {
        throw new error_response_1.UnAuthorizedException("Invalid or old login credentials");
    }
    return { user, decoded };
};
exports.decodeToken = decodeToken;
const createRevokeToken = async (decoded) => {
    const tokenModel = new token_repository_1.TokenRepository(token_model_1.TokenModel);
    const [result] = await tokenModel.create({
        data: [{
                jti: decoded.jti,
                expiresIn: decoded.iat + Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
                userId: decoded._id
            }]
    }) || [];
    if (!result) {
        throw new error_response_1.BadRequest("fail to revoke this token");
    }
    return result;
};
exports.createRevokeToken = createRevokeToken;
