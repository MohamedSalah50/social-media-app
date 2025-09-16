"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseRepository = void 0;
class DatabaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async create({ data, options, }) {
        return await this.model.create(data, options);
    }
    async findOne({ filter, select, options, }) {
        const doc = this.model.findOne(filter).select(select || "");
        if (options?.lean) {
            doc.lean(options.lean);
        }
        return await doc.exec();
    }
    async find({ filter, select, options, }) {
        const docs = this.model.find(filter || {}).select(select || "");
        if (options?.lean) {
            docs.lean(options.lean);
        }
        if (options) {
            docs.setOptions(options);
        }
        return await docs.exec();
    }
    async updateOne({ filter, update, options, }) {
        return await this.model.updateOne(filter, {
            ...update,
            $inc: {
                __v: 1,
            },
        }, options);
    }
    async findByIdAndUpdate({ id, update, options = { new: true }, }) {
        return await this.model.findByIdAndUpdate(id, {
            ...update,
            $inc: {
                __v: 1,
            },
        }, options);
    }
    async findOneAndUpdate({ filter = {}, update = {}, options = { new: true }, }) {
        if (Array.isArray(update)) {
            update.push({ $set: { __v: { $add: ["$__v", 1] } } });
            return await this.model.findOneAndUpdate(filter || {}, update, options);
        }
        return await this.model.findOneAndUpdate(filter, {
            ...update,
            $inc: {
                __v: 1,
            },
        }, options);
    }
    async deleteOne({ filter }) {
        return await this.model.deleteOne(filter);
    }
}
exports.DatabaseRepository = DatabaseRepository;
