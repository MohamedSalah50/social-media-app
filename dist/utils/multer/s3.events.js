"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const user_repository_1 = require("../../db/repository/user.repository");
const user_model_1 = require("../../db/models/user.model");
const s3_config_1 = require("./s3.config");
const s3event = new stream_1.EventEmitter();
s3event.on("trackProfileImageUpload", (data) => {
    setTimeout(async () => {
        const userModel = new user_repository_1.userRepository(user_model_1.UserModel);
        try {
            await (0, s3_config_1.getFile)({ key: data.oldKey });
            await userModel.updateOne({
                filter: { _id: data.userId },
                update: {
                    $unset: { tempProfileImage: 1 },
                },
            });
            await (0, s3_config_1.deleteFile)({ Key: data.oldKey });
            console.log("done 👌");
        }
        catch (error) {
            console.log(error);
            if (error.code === "NoSuchKey") {
                await userModel.updateOne({
                    filter: { _id: data.userId },
                    update: {
                        profileImage: data.oldKey,
                        $unset: { tempProfileImage: 1 },
                    },
                });
            }
        }
    }, data.expiresIn || Number(process.env.AWS_PRE_SIGNED_URL_EXPIRES_IN_SECONDS) * 1000);
});
exports.default = s3event;
