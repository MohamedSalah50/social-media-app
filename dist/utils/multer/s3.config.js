"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFolderByPrefix = exports.listDirectoryFiles = exports.deleteFiles = exports.deleteFile = exports.getFile = exports.createGetSignedLink = exports.createSignedUploadLink = exports.uploadFiles = exports.uploadLargeFile = exports.uploadFile = exports.s3config = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const uuid_1 = require("uuid");
const cloud_multer_1 = require("./cloud.multer");
const node_fs_1 = require("node:fs");
const error_response_1 = require("../response/error.response");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const s3config = () => {
    return new client_s3_1.S3Client({
        region: process.env.S3_REGION,
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY,
            secretAccessKey: process.env.S3_SECRET_KEY,
        },
    });
};
exports.s3config = s3config;
const uploadFile = async ({ storageAppraoch = cloud_multer_1.storageEnum.memory, Bucket = process.env.S3_BUCKET_NAME, ACL = "private", path = "general", file, }) => {
    const command = new client_s3_1.PutObjectCommand({
        Bucket,
        ACL,
        Key: `${process.env.APPLICATION_NAME}/${path}/${(0, uuid_1.v4)()}/_${file.originalname}`,
        Body: storageAppraoch === cloud_multer_1.storageEnum.memory
            ? file.buffer
            : (0, node_fs_1.createReadStream)(file.path),
        ContentType: file.mimetype,
    });
    await (0, exports.s3config)().send(command);
    if (!command?.input?.Key) {
        throw new error_response_1.BadRequest("fail to upload this file");
    }
    return command.input.Key;
};
exports.uploadFile = uploadFile;
const uploadLargeFile = async ({ storageAppraoch = cloud_multer_1.storageEnum.memory, Bucket = process.env.S3_BUCKET_NAME, ACL = "private", path = "general", file, }) => {
    const upload = new lib_storage_1.Upload({
        client: (0, exports.s3config)(),
        params: {
            Bucket,
            ACL,
            Key: `${process.env.APPLICATION_NAME}/${path}/${(0, uuid_1.v4)()}/_${file.originalname}`,
            Body: storageAppraoch === cloud_multer_1.storageEnum.memory
                ? file.buffer
                : (0, node_fs_1.createReadStream)(file.path),
            ContentType: file.mimetype,
        },
    });
    upload.on("httpUploadProgress", (progress) => {
        console.log("upload file progress is ", progress);
    });
    const { Key } = await upload.done();
    if (!Key) {
        throw new error_response_1.BadRequest("fail to generate this key");
    }
    return Key;
};
exports.uploadLargeFile = uploadLargeFile;
const uploadFiles = async ({ storageAppraoch = cloud_multer_1.storageEnum.memory, Bucket = process.env.S3_BUCKET_NAME, ACL = "private", path = "general", files, useLarge = false, }) => {
    let urls = [];
    if (useLarge) {
        urls = await Promise.all(files.map((file) => {
            return (0, exports.uploadLargeFile)({
                storageAppraoch,
                Bucket,
                ACL,
                path,
                file,
            });
        }));
    }
    else {
        urls = await Promise.all(files.map((file) => {
            return (0, exports.uploadFile)({
                storageAppraoch,
                Bucket,
                ACL,
                path,
                file,
            });
        }));
    }
    return urls;
};
exports.uploadFiles = uploadFiles;
// export const uploadLargeFiles = async ({
//   storageAppraoch = storageEnum.disk,
//   Bucket = process.env.S3_BUCKET_NAME as string,
//   ACL = "private",
//   path = "general",
//   files,
// }: {
//   storageAppraoch?: storageEnum;
//   Bucket?: string;
//   ACL?: ObjectCannedACL;
//   path?: string;
//   files: Express.Multer.File[];
// }): Promise<string[]> => {
//   let urls: string[] = [];
//   urls = await Promise.all(
//     files.map((file) => {
//       return uploadLargeFile({
//         storageAppraoch,
//         Bucket,
//         ACL,
//         path,
//         file,
//       });
//     })
//   );
//   return urls;
// };
const createSignedUploadLink = async ({ Bucket = process.env.S3_BUCKET_NAME, path = "general", expiresIn = Number(process.env.AWS_PRE_SIGNED_URL_EXPIRES_IN_SECONDS), ContentType, OriginalName, }) => {
    const command = new client_s3_1.PutObjectCommand({
        Bucket,
        Key: `${process.env.APPLICATION_NAME}/${path}/${(0, uuid_1.v4)()}/_${OriginalName}`,
        ContentType,
    });
    const url = await (0, s3_request_presigner_1.getSignedUrl)((0, exports.s3config)(), command, { expiresIn });
    if (!url || !command?.input?.Key) {
        throw new error_response_1.BadRequest("fail to create preSignedUrl");
    }
    return { url, Key: command.input.Key };
};
exports.createSignedUploadLink = createSignedUploadLink;
const createGetSignedLink = async ({ Bucket = process.env.S3_BUCKET_NAME, expiresIn = Number(process.env.AWS_PRE_SIGNED_URL_EXPIRES_IN_SECONDS), Key, downloadName = "dummy", download = "flase", }) => {
    const command = new client_s3_1.GetObjectCommand({
        Key,
        Bucket,
        ResponseContentDisposition: download === "true"
            ? `attachment; filename=${downloadName || Key.split("/").pop()} `
            : undefined,
    });
    const url = await (0, s3_request_presigner_1.getSignedUrl)((0, exports.s3config)(), command, { expiresIn });
    if (!url) {
        throw new error_response_1.BadRequest("fail to create this upload preSignedUrl");
    }
    return url;
};
exports.createGetSignedLink = createGetSignedLink;
const getFile = async ({ Bucket = process.env.S3_BUCKET_NAME, key, }) => {
    const command = new client_s3_1.GetObjectCommand({
        Key: key,
        Bucket,
    });
    return await (0, exports.s3config)().send(command);
};
exports.getFile = getFile;
const deleteFile = async ({ Key, Bucket = process.env.S3_BUCKET_NAME, }) => {
    const command = new client_s3_1.DeleteObjectCommand({
        Key,
        Bucket,
    });
    return await (0, exports.s3config)().send(command);
};
exports.deleteFile = deleteFile;
const deleteFiles = async ({ Bucket = process.env.S3_BUCKET_NAME, urls, Quiet = false, }) => {
    const Objects = urls.map((url) => {
        return { Key: url };
    });
    const command = new client_s3_1.DeleteObjectsCommand({
        Bucket,
        Delete: {
            Objects,
            Quiet,
        },
    });
    return await (0, exports.s3config)().send(command);
};
exports.deleteFiles = deleteFiles;
const listDirectoryFiles = async ({ Bucket = process.env.S3_BUCKET_NAME, path, }) => {
    const command = new client_s3_1.ListObjectsCommand({
        Bucket,
        Prefix: `${process.env.APPLICATION_NAME}/${path}`,
    });
    return await (0, exports.s3config)().send(command);
};
exports.listDirectoryFiles = listDirectoryFiles;
const deleteFolderByPrefix = async ({ Bucket = process.env.S3_BUCKET_NAME, path, Quiet = false, }) => {
    const fileList = await (0, exports.listDirectoryFiles)({
        path,
        Bucket,
    });
    if (!fileList?.Contents?.length) {
        throw new error_response_1.BadRequest("empty directories");
    }
    const urls = fileList.Contents.map((file) => file.Key);
    return await (0, exports.deleteFiles)({ urls, Bucket, Quiet });
};
exports.deleteFolderByPrefix = deleteFolderByPrefix;
