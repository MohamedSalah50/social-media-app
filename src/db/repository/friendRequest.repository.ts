import { Model } from "mongoose";
import { IFriendRequest as TDocumet } from "../models/friendRequest.model";
import { DatabaseRepository } from "./database.repository";

export class FriendRequestRepository extends DatabaseRepository<TDocumet> {
    constructor(protected override readonly model: Model<TDocumet>) {
        super(model)
    }
}