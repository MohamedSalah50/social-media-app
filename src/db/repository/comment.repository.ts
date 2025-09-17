import { Model } from "mongoose";
import { IComment as TDocumet } from "../models/comment.model";
import { DatabaseRepository } from "./database.repository";

export class commentRepository extends DatabaseRepository<TDocumet> {
    constructor(protected override readonly model: Model<TDocumet>) {
        super(model)
    }
}