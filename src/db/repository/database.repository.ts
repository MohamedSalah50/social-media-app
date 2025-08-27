import { FlattenMaps, QueryOptions } from "mongoose";
import { ProjectionType } from "mongoose";
import { CreateOptions, HydratedDocument, Model, RootFilterQuery } from "mongoose";

export type Lean<T> = HydratedDocument<FlattenMaps<T>>
export abstract class DatabaseRepository<TDocument> {
    constructor(protected readonly model: Model<TDocument>) { }

    async create({ data, options }: { data: Partial<TDocument>[], options?: CreateOptions | undefined }): Promise<HydratedDocument<TDocument>[] | undefined> {
        return await this.model.create(data, options);
    }

    async findOne({ filter, select, options }: {
        filter?: RootFilterQuery<TDocument>,
        select?: ProjectionType<TDocument> | null,
        options?: QueryOptions<TDocument> | null
    }): Promise<Lean<TDocument> | HydratedDocument<TDocument> | null> {
        const doc = this.model.findOne(filter).select(select || "");
        if (options?.lean) {
            doc.lean(options.lean)
        }
        return await doc.exec();
    }

}