"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostModel = exports.likeActionEnum = exports.AvailabilityEnum = exports.AllowCommentsEnum = void 0;
const mongoose_1 = require("mongoose");
const email_event_1 = require("../../utils/events/email.event");
var AllowCommentsEnum;
(function (AllowCommentsEnum) {
    AllowCommentsEnum["allow"] = "allow";
    AllowCommentsEnum["deny"] = "deny";
})(AllowCommentsEnum || (exports.AllowCommentsEnum = AllowCommentsEnum = {}));
var AvailabilityEnum;
(function (AvailabilityEnum) {
    AvailabilityEnum["public"] = "public";
    AvailabilityEnum["friends"] = "friends";
    AvailabilityEnum["onlyMe"] = "only-me";
})(AvailabilityEnum || (exports.AvailabilityEnum = AvailabilityEnum = {}));
var likeActionEnum;
(function (likeActionEnum) {
    likeActionEnum["like"] = "like";
    likeActionEnum["unlike"] = "unlike";
})(likeActionEnum || (exports.likeActionEnum = likeActionEnum = {}));
const postSchema = new mongoose_1.Schema({
    content: {
        type: String, minlength: 2, maxlength: 500000, required: function () {
            return !this.attachments?.length;
        }
    },
    attachments: [String],
    assetsFolderId: { type: String, required: true },
    availability: { type: String, enum: AvailabilityEnum, default: AvailabilityEnum.public },
    allowComments: { type: String, enum: AllowCommentsEnum, default: AllowCommentsEnum.allow },
    likes: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    tags: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    createdBy: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    freezedAt: Date,
    freezedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    restoredAt: Date,
    restoredBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true, strictQuery: true, toObject: { virtuals: true }, toJSON: { virtuals: true } });
postSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, freezedAt: { $exists: false } });
    }
    next();
});
postSchema.post("save", async function (doc, save) {
    if (doc.tags?.length) {
        const users = await (0, mongoose_1.model)("User").find({ _id: { $in: doc.tags } }, { email: 1 });
        for (const user of users) {
            if (user.email) {
                email_event_1.emailEmitter.emit("send-tags", { to: user.email });
            }
        }
    }
});
exports.PostModel = mongoose_1.models.Post || (0, mongoose_1.model)("Post", postSchema);
