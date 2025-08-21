import mongoose from "mongoose";


export const connectDb = async (): Promise<void> => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log("Connected to MongoDB🚀");
    } catch (error) {
        console.log("db connection failed❌");
        console.error(error);
    }
}