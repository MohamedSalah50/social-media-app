"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = exports.ProviderEnum = exports.GenderEnum = void 0;
const mongoose_1 = require("mongoose");
var GenderEnum;
(function (GenderEnum) {
    GenderEnum["male"] = "male";
    GenderEnum["female"] = "female";
})(GenderEnum || (exports.GenderEnum = GenderEnum = {}));
var RoleEnum;
(function (RoleEnum) {
    RoleEnum["user"] = "user";
    RoleEnum["admin"] = "admin";
})(RoleEnum || (RoleEnum = {}));
var ProviderEnum;
(function (ProviderEnum) {
    ProviderEnum["Google"] = "Google";
    ProviderEnum["System"] = "System";
})(ProviderEnum || (exports.ProviderEnum = ProviderEnum = {}));
const userSchema = new mongoose_1.Schema({
    firstName: { type: String, required: true, minLength: 2, maxLength: 20 },
    lastName: { type: String, required: true, minLength: 2, maxLength: 20 },
    slug: { type: String, minLength: 5, maxLength: 51 },
    email: { type: String, unique: true, required: true },
    confirmEmailOtp: { type: String },
    confirmedAt: { type: Date },
    password: {
        type: String,
        required: function () {
            return this.provider === ProviderEnum.Google ? false : true;
        },
    },
    resetPasswordOtp: { type: String },
    changeCredentialsTime: { type: Date },
    profileImage: { type: String },
    tempProfileImage: { type: String },
    coverImages: [String],
    freezedAt: { type: Date },
    freezedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    restoredAt: { type: Date },
    restoredBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    phone: { type: String },
    address: { type: String },
    gender: { type: String, enum: GenderEnum, default: GenderEnum.male },
    role: { type: String, enum: RoleEnum, default: RoleEnum.user },
    provider: {
        type: String,
        enum: ProviderEnum,
        default: ProviderEnum.System,
    },
    loginTempOtp: { type: String },
    tempEmail: { type: String },
    tempEmailOtp: { type: String },
    temp2faOtp: { type: String },
    is2faEnabled: { type: Boolean, default: false }
}, {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
userSchema
    .virtual("username")
    .set(function (value) {
    const [firstName, lastName] = value.split(" ") || [];
    this.set({ firstName, lastName, slug: value.replaceAll(/\s+/g, "-") });
})
    .get(function () {
    return this.firstName + " " + this.lastName;
});
// userSchema.pre("findOne", async function (next) {
//   const query = this.getQuery();
//   console.log({ this: this, query });
//   if (query.paranoid === false) {
//     this.setQuery({ ...query })
//   } else {
//     this.setQuery({ ...query, freezedAt: { $exists: false } })
//   }
//   next();
// })
// userSchema.pre("save", async function (this: HUserDocument & { wasNew: boolean }, next) {
//   this.wasNew = this.isNew || this.isModified("email");
//   console.log({ prevalidate: this, password: this.isModified("password") });
//   if (this.isModified("password")) {
//     this.password = await generateHash(this.password);
//   }
// })
// userSchema.post("save", async function (doc, next) {
//   const that = this as HUserDocument & { wasNew: boolean };
//   if (that.wasNew) {
//     emailEmitter.emit("sendConfirmEmail", { to: this.email, otp: 1516515 });
//   }
//   next();
// })
exports.UserModel = mongoose_1.models.User || (0, mongoose_1.model)("User", userSchema);
