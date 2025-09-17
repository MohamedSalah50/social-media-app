import { HydratedDocument, model, models, Schema, Types } from "mongoose";
// import { emailEmitter } from "../../utils/events/email.event";


export interface IFriendRequest {
    createdBy: Types.ObjectId;
    sendTo: Types.ObjectId;
    acceptedAt: Date;



    createdAt: Date;
    updatedAt?: Date;
}


export type HFriendRequestDocument = HydratedDocument<IFriendRequest>;


const friendRequestSchema = new Schema<IFriendRequest>({

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sendTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
    acceptedAt: Date,

},
    {
        timestamps: true,
        strictQuery: true,
        // toObject: { virtuals: true },
        // toJSON: { virtuals: true }
    });


// commentSchema.virtual("reply", {
//     localField: "_id",
//     foreignField: "commentId",
//     ref: "Comment"
// })


// commentSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
//     const query = this.getQuery();
//     if (query.paranoid === false) {
//         this.setQuery({ ...query })
//     } else {
//         this.setQuery({ ...query, freezedAt: { $exists: false } })
//     }
//     next()
// })

// commentSchema.post("save", async function (doc, save) {
//     if (doc.tags?.length) {
//         const users = await model("User").find({ _id: { $in: doc.tags } }, { email: 1 });
//         for (const user of users) {
//             if (user.email) {
//                 emailEmitter.emit("send-tags", { to: user.email });
//             }
//         }
//     }
// })


export const FriendRequestModel = models.FriendRequest || model<IFriendRequest>("FriendRequest", friendRequestSchema);
