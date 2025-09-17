"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentModel = void 0;
const mongoose_1 = require("mongoose");
const email_event_1 = require("../../utils/events/email.event");
const commentSchema = new mongoose_1.Schema({
    content: {
        type: String, minlength: 2, maxlength: 500000, required: true
    },
    attachments: [String],
    likes: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    tags: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    createdBy: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    postId: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Post", required: true }],
    commentId: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Comment" }],
    freezedAt: Date,
    freezedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    restoredAt: Date,
    restoredBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
}, {
    timestamps: true,
    strictQuery: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});
commentSchema.virtual("reply", {
    localField: "_id",
    foreignField: "commentId",
    ref: "Comment"
});
commentSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, freezedAt: { $exists: false } });
    }
    next();
});
commentSchema.post("save", async function (doc, save) {
    if (doc.tags?.length) {
        const users = await (0, mongoose_1.model)("User").find({ _id: { $in: doc.tags } }, { email: 1 });
        for (const user of users) {
            if (user.email) {
                email_event_1.emailEmitter.emit("send-tags", { to: user.email });
            }
        }
    }
});
exports.CommentModel = mongoose_1.models.Comment || (0, mongoose_1.model)("Comment", commentSchema);
