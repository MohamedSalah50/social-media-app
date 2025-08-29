"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = require("../../db/models/user.model");
const token_security_1 = require("../../utils/security/token.security");
const user_repository_1 = require("../../db/repository/user.repository");
class UserService {
    userModel = new user_repository_1.userRepository(user_model_1.UserModel);
    // private tokenModel = new TokenRepository(TokenModel);
    constructor() { }
    profile = async (req, res) => {
        return res.json({
            message: "user profile", data: {
                user: req.user?._id,
                decoded: req.decoded?.iat
            }
        });
    };
    logout = async (req, res) => {
        const flag = req.body;
        let statusCode = 200;
        const update = {};
        switch (flag) {
            case token_security_1.LogOutEnum.all:
                update.changeCredentialsTime = new Date();
                break;
            default:
                await (0, token_security_1.createRevokeToken)(req.decoded);
                statusCode = 201;
                break;
        }
        await this.userModel.updateOne({ filter: { _id: req.user?._id }, update });
        return res.status(statusCode).json({
            message: "user profile"
        });
    };
    refreshToken = async (req, res) => {
        const credentials = await (0, token_security_1.createLoginCredentials)(req.user);
        await (0, token_security_1.createRevokeToken)(req.decoded);
        return res.status(201).json({ message: "done", data: { credentials } });
    };
}
exports.default = new UserService();
