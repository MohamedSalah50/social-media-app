"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = exports.s3config = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const uuid_1 = require("uuid");
const cloud_multer_1 = require("./cloud.multer");
const node_fs_1 = require("node:fs");
const error_response_1 = require("../response/error.response");
const s3config = () => {
    return new client_s3_1.S3Client({
        region: process.env.S3_REGION,
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY,
            secretAccessKey: process.env.S3_SECRET_KEY,
        }
    });
};
exports.s3config = s3config;
const uploadFile = async ({ storageAppraoch = cloud_multer_1.storageEnum.memory, Bucket = process.env.S3_BUCKET_NAME, ACL = "private", path = "general", file }) => {
    const command = new client_s3_1.PutObjectCommand({
        Bucket,
        ACL,
        Key: `${process.env.APPLICATION_NAME}/${path}/${(0, uuid_1.v4)()}/_${file.originalname}`,
        Body: storageAppraoch === cloud_multer_1.storageEnum.memory ? file.buffer : (0, node_fs_1.createReadStream)(file.path),
        ContentType: file.mimetype
    });
    await (0, exports.s3config)().send(command);
    if (!command?.input?.Key) {
        throw new error_response_1.BadRequest("fail to upload this file");
    }
    return command.input.Key;
};
exports.uploadFile = uploadFile;
