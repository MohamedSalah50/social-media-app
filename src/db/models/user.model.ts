import { Schema, model, models, InferSchemaType } from "mongoose";
// import { Document, HydratedDocument } from "mongoose";

// export interface IUser extends Document {
//     username: string;
//     email: string;
//     password: string;
//     phone: string;
//     confirmHashedOtp?: string;
//     isEmailVerified: boolean;
// }

// export type UserDocument = HydratedDocument<IUser>;

const userSchema = new Schema(
    {
        username: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        phone: { type: String, required: true },
        confirmHashedOtp: { type: String },
        isEmailVerified: { type: Boolean, default: false }
    },
    { timestamps: true }
);

export type IUser = InferSchemaType<typeof userSchema>;


export const userModel = models.User || model<IUser>("User", userSchema);
