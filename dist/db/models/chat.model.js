"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModel = void 0;
const mongoose_1 = require("mongoose");
const MessageSchema = new mongoose_1.Schema({
    content: { type: String, required: true },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
}, {
    timestamps: true,
    strictQuery: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});
const chatSchema = new mongoose_1.Schema({
    participants: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true }],
    messages: [MessageSchema],
    group: String,
    group_image: { type: String },
    roomId: {
        type: String, required: function () {
            return this.group;
        }
    },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
}, {
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
exports.ChatModel = mongoose_1.models.Chat || (0, mongoose_1.model)("Chat", chatSchema);
