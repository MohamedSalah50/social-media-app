"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDb = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDb = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB🚀");
    }
    catch (error) {
        console.log("db connection failed❌");
        console.error(error);
    }
};
exports.connectDb = connectDb;
