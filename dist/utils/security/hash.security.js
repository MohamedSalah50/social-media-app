"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareHash = exports.generateHash = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Hash
const generateHash = ({ plainText = "", saltRound = Number(process.env.SALT_ROUND) || 10, }) => {
    return bcryptjs_1.default.hashSync(plainText, saltRound);
};
exports.generateHash = generateHash;
// Compare Hash
const compareHash = async ({ plainText = "", cipherText = "", }) => {
    return bcryptjs_1.default.compare(plainText, cipherText);
};
exports.compareHash = compareHash;
