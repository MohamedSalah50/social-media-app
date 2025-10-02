"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allPosts = exports.GraphQlOnePostResponse = exports.GraphQlAvailabilityEnum = exports.GraphQlAllowCommentsEnum = void 0;
const graphql_1 = require("graphql");
const models_1 = require("../../db/models");
const user_1 = require("../user");
exports.GraphQlAllowCommentsEnum = new graphql_1.GraphQLEnumType({
    name: "AllowCommentsEnum",
    values: {
        allow: { value: models_1.AllowCommentsEnum.allow },
        deny: { value: models_1.AllowCommentsEnum.deny }
    }
});
exports.GraphQlAvailabilityEnum = new graphql_1.GraphQLEnumType({
    name: "AvailabilityEnum",
    values: {
        friends: { value: models_1.AvailabilityEnum.friends },
        onlyMe: { value: models_1.AvailabilityEnum.onlyMe },
        public: { value: models_1.AvailabilityEnum.public },
    }
});
exports.GraphQlOnePostResponse = new graphql_1.GraphQLObjectType({
    name: "onePostResponse",
    fields: {
        _id: { type: graphql_1.GraphQLID },
        content: { type: graphql_1.GraphQLString },
        attachments: { type: new graphql_1.GraphQLList(graphql_1.GraphQLString) },
        assetsFolderId: { type: graphql_1.GraphQLString },
        allowComments: { type: exports.GraphQlAllowCommentsEnum },
        availability: { type: exports.GraphQlAvailabilityEnum },
        likes: { type: new graphql_1.GraphQLList(graphql_1.GraphQLID) },
        tags: { type: new graphql_1.GraphQLList(graphql_1.GraphQLID) },
        createdBy: { type: user_1.GraphQlUserResponse },
        freezedAt: { type: graphql_1.GraphQLString },
        freezedBy: { type: graphql_1.GraphQLID },
        restoredAt: { type: graphql_1.GraphQLString },
        restoredBy: { type: graphql_1.GraphQLID },
        createdAt: { type: graphql_1.GraphQLString },
        updatedAt: { type: graphql_1.GraphQLString },
    }
});
exports.allPosts = new graphql_1.GraphQLObjectType({
    name: "allPosts",
    fields: {
        docsCount: { type: graphql_1.GraphQLInt },
        limit: { type: graphql_1.GraphQLInt },
        page: { type: graphql_1.GraphQLInt },
        currentPage: { type: graphql_1.GraphQLInt },
        result: { type: new graphql_1.GraphQLList(exports.GraphQlOnePostResponse) }
    }
});
