import { HChatDocument } from "../../db/models";
import { HUserDocument } from "../../db/models/user.model";

export interface IProfileImage {
  url: string;
}

export interface IUserResponse {
  user: Partial<HUserDocument>;
  groups?: Partial<HChatDocument>[]
}
