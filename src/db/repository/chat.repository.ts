import { Model, PopulateOptions, QueryOptions } from "mongoose";
import { IChat as TDocument } from "../models/chat.model";
import { DatabaseRepository, Lean } from "./database.repository";
import { RootFilterQuery } from "mongoose";
import { ProjectionType } from "mongoose";
import { HydratedDocument } from "mongoose";

export class chatRepository extends DatabaseRepository<TDocument> {
    constructor(protected override readonly model: Model<TDocument>) {
        super(model)
    }

    async findOneChat({ filter, select, options, page = 1, size = 5 }: {
        // RootFilterQuery partial on types 
        filter?: RootFilterQuery<TDocument>,
        select?: ProjectionType<TDocument> | null,
        options?: QueryOptions<TDocument> | null,
        page?: number,
        size?: number,
    }): Promise<
        Lean<TDocument>
        | HydratedDocument<TDocument>
        | null
    > {

        page = Math.floor(!page || page < 1 ? 1 : page);
        size = Math.floor(!size || size < 1 ? 5 : size);

        const doc = this.model.findOne(filter, {
            messages: { $slice: [-page * size, size] }
        })
        if (options?.populate) {
            doc.populate(options?.populate as PopulateOptions[]);
        };
        if (options?.lean) {
            doc.lean(options?.lean)
        };
        return await doc.exec()
    }
}