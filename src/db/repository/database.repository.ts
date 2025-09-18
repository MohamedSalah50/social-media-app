import {
  DeleteResult,
  FlattenMaps,
  QueryOptions,
  Types,
  UpdateQuery,
  UpdateWriteOpResult,
} from "mongoose";
import { MongooseUpdateQueryOptions } from "mongoose";
import { ProjectionType } from "mongoose";
import {
  CreateOptions,
  HydratedDocument,
  Model,
  RootFilterQuery,
} from "mongoose";

export type Lean<T> = HydratedDocument<FlattenMaps<T>>;
export abstract class DatabaseRepository<TDocument> {
  constructor(protected readonly model: Model<TDocument>) { }

  async create({
    data,
    options,
  }: {
    data: Partial<TDocument>[];
    options?: CreateOptions | undefined;
  }): Promise<HydratedDocument<TDocument>[] | undefined> {
    return await this.model.create(data, options);
  }

 async findOne({
    filter,
    select,
    options,
  }: {
    filter?: RootFilterQuery<TDocument>;
    select?: ProjectionType<TDocument> | null;
    options?: QueryOptions<TDocument> | null;
  }): Promise<Lean<TDocument> | HydratedDocument<TDocument> | null> {
    const doc = this.model.findOne(filter).select(select || "");
    if (options?.lean) {
      doc.lean(options.lean);
    }
    return await doc.exec();
  }


  async paginate({
    filter,
    options = {},
    select,
    page = "all",
    size,
  }: {
    filter?: RootFilterQuery<TDocument>;
    select?: ProjectionType<TDocument> | undefined;
    options?: QueryOptions<TDocument> | undefined;
    page?: number | "all";
    size?: number;
  }): Promise<any> {

    let doc_count: number | undefined = undefined
    let pages: number = 1

    if (page != "all") {
      page = Math.floor(page < 1 ? 1 : page);
      options.limit = Math.floor(size || Number(process.env.PAGE_SIZE) || 2);
      options.skip = (page - 1) * options.limit;
      doc_count = await this.model.countDocuments(filter)
      pages = Math.ceil(doc_count / options.limit)
    }


    const result = await this.find({ filter: filter || {}, select, options });

    return {
      doc_count, pages: page == "all" ? undefined : pages
      , current_page: page == "all" ? undefined : page,
      limit: options.limit, result
    };
  }



  async find({
    filter,
    select,
    options,
  }: {
    filter: RootFilterQuery<TDocument>;
    select?: ProjectionType<TDocument> | undefined;
    options?: QueryOptions<TDocument> | undefined;
  }): Promise<Lean<TDocument>[] | HydratedDocument<TDocument>[] | []> {
    const docs = this.model.find(filter || {}).select(select || "");

    if (options?.lean) {
      docs.lean(options.lean);
    }

    if (options) {
      docs.setOptions(options);
    }

    return await docs.exec();
  }




  async updateOne({
    filter,
    update,
    options,
  }: {
    filter: RootFilterQuery<TDocument>;
    update: UpdateQuery<TDocument>;
    options?: MongooseUpdateQueryOptions<TDocument> | null;
  }): Promise<UpdateWriteOpResult> {
    return await this.model.updateOne(
      filter,
      {
        ...update,
        $inc: {
          __v: 1,
        },
      },
      options
    );
  }

  async findByIdAndUpdate({
    id,
    update,
    options = { new: true },
  }: {
    id: Types.ObjectId;
    update?: UpdateQuery<TDocument>;
    options?: QueryOptions<TDocument> | null;
  }): Promise<HydratedDocument<TDocument> | Lean<TDocument> | null> {
    return await this.model.findByIdAndUpdate(
      id,
      {
        ...update,
        $inc: {
          __v: 1,
        },
      },
      options
    );
  }

  async findOneAndUpdate({
    filter = {},
    update = {},
    options = { new: true },
  }: {
    filter?: RootFilterQuery<TDocument>,
    update?: UpdateQuery<TDocument>,
    options?: QueryOptions<TDocument> | null;
  }): Promise<HydratedDocument<TDocument> | Lean<TDocument> | null> {
    if (Array.isArray(update)) {
      update.push({ $set: { __v: { $add: ["$__v", 1] } } });
      return await this.model.findOneAndUpdate(filter || {}, update, options);
    }
    return await this.model.findOneAndUpdate(
      filter,
      {
        ...update,
        $inc: {
          __v: 1,
        },
      },
      options
    );
  }


  async deleteOne({ filter }: { filter: RootFilterQuery<TDocument> }): Promise<DeleteResult> {
    return await this.model.deleteOne(filter);
  }


}
