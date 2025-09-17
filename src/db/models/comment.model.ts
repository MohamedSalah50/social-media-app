import { HydratedDocument, model, models, Schema, Types } from "mongoose";
import { emailEmitter } from "../../utils/events/email.event";
import { IPost } from "./post.model";


export interface IComment {
    content?: string;
    attachments?: string[];
    likes?: Types.ObjectId[];
    tags?: Types.ObjectId[];


    createdBy: Types.ObjectId;
    postId: Types.ObjectId | Partial<IPost>;
    commentId: Types.ObjectId;

    freezedAt?: Date;
    freezedBy?: Types.ObjectId;
    restoredAt?: Date;
    restoredBy?: Types.ObjectId;



    createdAt: Date;
    updatedAt?: Date;
}


export type HPostDocument = HydratedDocument<IComment>;


const commentSchema = new Schema<IComment>({
    content: {
        type: String, minlength: 2, maxlength: 500000, required: true
    },
    attachments: [String],

    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    tags: [{ type: Schema.Types.ObjectId, ref: "User" }],


    createdBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    postId: [{ type: Schema.Types.ObjectId, ref: "Post", required: true }],
    commentId: [{ type: Schema.Types.ObjectId, ref: "Comment" }],

    freezedAt: Date,
    freezedBy: { type: Schema.Types.ObjectId, ref: "User" },
    restoredAt: Date,
    restoredBy: { type: Schema.Types.ObjectId, ref: "User" },
},
    {
        timestamps: true,
        strictQuery: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    });


    commentSchema.virtual("reply",{
        localField:"_id",
        foreignField:"commentId",
        ref:"Comment"
    })


commentSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query })
    } else {
        this.setQuery({ ...query, freezedAt: { $exists: false } })
    }
    next()
})

commentSchema.post("save", async function (doc, save) {
    if (doc.tags?.length) {
        const users = await model("User").find({ _id: { $in: doc.tags } }, { email: 1 });
        for (const user of users) {
            if (user.email) {
                emailEmitter.emit("send-tags", { to: user.email });
            }
        }
    }
})


export const CommentModel = models.Comment || model<IComment>("Comment", commentSchema);
