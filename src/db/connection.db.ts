import { connect } from "mongoose";
import { UserModel } from "./models/user.model";


export const connectDb = async (): Promise<void> => {
    try {
        await connect(process.env.MONGO_URI as string, {
            serverSelectionTimeoutMS: 3000
        });
        await UserModel.syncIndexes();
        // console.log(result.models);
        console.log("Connected to MongoDB🚀");
    } catch (error) {
        console.log("db connection failed❌");
        console.error(error);
    }
}