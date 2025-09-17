"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendRequestModel = void 0;
const mongoose_1 = require("mongoose");
const friendRequestSchema = new mongoose_1.Schema({
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    sendTo: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    acceptedAt: Date,
}, {
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
exports.FriendRequestModel = mongoose_1.models.FriendRequest || (0, mongoose_1.model)("FriendRequest", friendRequestSchema);
