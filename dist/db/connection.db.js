"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDb = void 0;
const mongoose_1 = require("mongoose");
const user_model_1 = require("./models/user.model");
const connectDb = async () => {
    try {
        await (0, mongoose_1.connect)(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 3000
        });
        await user_model_1.UserModel.syncIndexes();
        // console.log(result.models);
        console.log("Connected to MongoDB🚀");
    }
    catch (error) {
        console.log("db connection failed❌");
        console.error(error);
    }
};
exports.connectDb = connectDb;
