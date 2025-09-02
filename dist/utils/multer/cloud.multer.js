"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudFileUpload = exports.fileValidation = exports.storageEnum = void 0;
const multer_1 = __importDefault(require("multer"));
const error_response_1 = require("../response/error.response");
const os_1 = __importDefault(require("os"));
const uuid_1 = require("uuid");
var storageEnum;
(function (storageEnum) {
    storageEnum["memory"] = "memory";
    storageEnum["disk"] = "disk";
})(storageEnum || (exports.storageEnum = storageEnum = {}));
exports.fileValidation = {
    image: ['image/jpeg', 'image/png', 'image/jpg']
};
const cloudFileUpload = ({ validation = [], storageAppraoch = storageEnum.memory, maxSize = 2 }) => {
    const storage = storageAppraoch === storageEnum.memory ? multer_1.default.memoryStorage()
        : multer_1.default.diskStorage({
            destination: os_1.default.tmpdir(), filename: function (req, file, callback) {
                callback(null, `$${(0, uuid_1.v4)()}_${file.originalname}`);
            }
        });
    function fileFilter(req, file, callback) {
        if (!validation.includes(file.mimetype)) {
            return callback(new error_response_1.BadRequest("validation error", { validationErrors: [{ path: "file", issues: [{ path: "file", message: "invalid file format" }] }] }));
        }
        return callback(null, true);
    }
    return (0, multer_1.default)({ fileFilter, limits: { fileSize: maxSize * 1024 * 1024 }, storage });
};
exports.cloudFileUpload = cloudFileUpload;
