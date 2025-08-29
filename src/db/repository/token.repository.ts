import { DatabaseRepository } from "./database.repository";
import { IToken as TDocumet } from "../models/token.model";
import { Model } from "mongoose";

export class TokenRepository extends DatabaseRepository<TDocumet> {
    constructor(protected override readonly model: Model<TDocumet>) {
        super(model)
    }
}