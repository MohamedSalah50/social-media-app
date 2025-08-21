"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const generateToken = ({ payload, type }) => {
    let signature = "";
    let options = {};
    if (type === "access") {
        signature = JWT_SECRET || "lbjbei";
        options = { expiresIn: "15m" };
    }
    if (type === "refresh") {
        signature = JWT_REFRESH_SECRET || "kwmkmkmocmmwcwemo";
        options = { expiresIn: "7d" };
    }
    return jsonwebtoken_1.default.sign(payload, signature, options);
};
exports.generateToken = generateToken;
