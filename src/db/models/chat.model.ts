import { HydratedDocument, model, models, Schema, Types } from "mongoose";

export interface IMessage {
    createdBy: Types.ObjectId;
    content: string;
    createdAt?: Date;
    updatedAt?: Date
}
export type HMessageDocument = HydratedDocument<IMessage>;
export interface IChat {
    participants: Types.ObjectId[];
    messages?: IMessage[];
    group?: string;
    group_image?: string;
    roomId?: string;
    createdBy: Types.ObjectId;

    createdAt: Date;
    updatedAt?: Date;
}


export type HChatDocument = HydratedDocument<IChat>;



const MessageSchema = new Schema<IMessage>({
    content: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
},
    {
        timestamps: true,
        strictQuery: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    });




const chatSchema = new Schema<IChat>({
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    messages: [MessageSchema],
    group: String,
    group_image: { type: String },
    roomId: {
        type: String, required: function () {
            return this.group
        }
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
},
    {
        timestamps: true,
        strictQuery: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
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

// commentSchema.post("deleteOne", { query: true, document: false }, async function () {
//     const filter = this.getFilter();
//     if (filter._id) {
//         await model("Comment").deleteMany({ commentId: filter._id });
//     }
// });



export const ChatModel = models.Chat || model<IChat>("Chat", chatSchema);
