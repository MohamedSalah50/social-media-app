import { Model } from "mongoose";
import { IPost as TDocumet } from "../models/post.model";
import { DatabaseRepository } from "./database.repository";

export class PostRepository extends DatabaseRepository<TDocumet> {
    constructor(protected override readonly model: Model<TDocumet>) {
        super(model)
    }
}