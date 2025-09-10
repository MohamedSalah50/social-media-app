import { Schema, model, models, Types, HydratedDocument } from "mongoose";


export enum GenderEnum {
  male = "male",
  female = "female",
}

enum RoleEnum {
  user = "user",
  admin = "admin",
}

export enum ProviderEnum {
  Google = "Google",
  System = "System",
}

export interface IUser {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  username?: string;
  slug?: string;
  email: string;
  confirmEmailOtp?: string;
  confirmedAt?: Date;
  password: string;
  resetPasswordOtp?: string;
  changeCredentialsTime?: Date;
  phone: string;
  profileImage?: string;
  tempProfileImage?: string;
  coverImages?: string[];
  freezedAt?: Date;
  freezedBy?: Types.ObjectId;
  restoredAt?: Date;
  restoredBy?: Types.ObjectId;
  address?: string;
  gender?: GenderEnum;
  role?: RoleEnum;
  createdAt: Date;
  updatedAt?: Date;
  provider?: ProviderEnum;
}

const userSchema = new Schema<IUser>(
  {
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
    freezedBy: { type: Schema.Types.ObjectId, ref: "User" },
    restoredAt: { type: Date },
    restoredBy: { type: Schema.Types.ObjectId, ref: "User" },
    phone: { type: String },
    address: { type: String },
    gender: { type: String, enum: GenderEnum, default: GenderEnum.male },
    role: { type: String, enum: RoleEnum, default: RoleEnum.user },
    provider: {
      type: String,
      enum: ProviderEnum,
      default: ProviderEnum.System,
    },
  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema
  .virtual("username")
  .set(function (value: string) {
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


export const UserModel = models.User || model<IUser>("User", userSchema);
export type HUserDocument = HydratedDocument<IUser>;
