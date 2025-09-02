import multer, { FileFilterCallback } from "multer";
import { BadRequest } from "../response/error.response";
import { Request } from "express";
import os from "os";
import { v4 as uuid } from "uuid"

export enum storageEnum {
    memory = "memory",
    disk = "disk"
}

export const fileValidation = {
    image: ['image/jpeg', 'image/png', 'image/jpg']
}

export const cloudFileUpload = ({ validation = [], storageAppraoch = storageEnum.memory, maxSize = 2 }: { validation?: string[], storageAppraoch?: storageEnum, maxSize?: number }): multer.Multer => {
    const storage = storageAppraoch === storageEnum.memory ? multer.memoryStorage()
        : multer.diskStorage({
            destination: os.tmpdir(), filename: function (req: Request, file: Express.Multer.File, callback) {
                callback(null, `$${uuid()}_${file.originalname}`)
            }
        })

    function fileFilter(req: Request, file: Express.Multer.File, callback: FileFilterCallback) {
        if (!validation.includes(file.mimetype)) {
            return callback(new BadRequest("validation error", { validationErrors: [{ path: "file", issues: [{ path: "file", message: "invalid file format" }] }] }))
        }
        return callback(null, true)
    }


    return multer({ fileFilter, limits: { fileSize: maxSize * 1024 * 1024 }, storage });
}