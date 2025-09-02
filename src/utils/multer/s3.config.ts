import { ObjectCannedACL, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { v4 as uuid } from "uuid"
import { storageEnum } from "./cloud.multer";
import { createReadStream } from "node:fs";
import { BadRequest } from "../response/error.response";

export const s3config = () => {
    return new S3Client({
        region: process.env.S3_REGION as string,
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY as string,
            secretAccessKey: process.env.S3_SECRET_KEY as string,
        }
    })
}


export const uploadFile = async ({ storageAppraoch = storageEnum.memory, Bucket = process.env.S3_BUCKET_NAME, ACL = "private", path = "general", file }:
    { storageAppraoch?: storageEnum, Bucket?: string, ACL?: ObjectCannedACL, path?: string, file: Express.Multer.File }): Promise<string> => {
    const command = new PutObjectCommand({
        Bucket,
        ACL,
        Key: `${process.env.APPLICATION_NAME}/${path}/${uuid()}/_${file.originalname}` as string,
        Body: storageAppraoch === storageEnum.memory ? file.buffer : createReadStream(file.path),
        ContentType: file.mimetype
    })

    await s3config().send(command)

    if (!command?.input?.Key) {
        throw new BadRequest("fail to upload this file")
    }

    return command.input.Key

}