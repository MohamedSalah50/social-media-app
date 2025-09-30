"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFollower = exports.searchUser = exports.allUsers = exports.GraphQlUserResponse = exports.GraphQlGenderEnum = void 0;
const graphql_1 = require("graphql");
const models_1 = require("../../db/models");
const types_gql_1 = require("../graphql/types.gql");
exports.GraphQlGenderEnum = new graphql_1.GraphQLEnumType({
    name: "GenderEnum",
    values: {
        male: { value: models_1.GenderEnum.male },
        female: { value: models_1.GenderEnum.female }
    }
});
exports.GraphQlUserResponse = new graphql_1.GraphQLObjectType({
    name: "oneUserResponse",
    fields: {
        id: { type: graphql_1.GraphQLID },
        name: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString), description: "userName" },
        email: { type: graphql_1.GraphQLString },
        gender: { type: exports.GraphQlGenderEnum },
        followers: { type: new graphql_1.GraphQLList(graphql_1.GraphQLID) },
    }
});
exports.allUsers = new graphql_1.GraphQLList(exports.GraphQlUserResponse);
exports.searchUser = (0, types_gql_1.GraphQlUniformResponse)({
    name: "searchUser",
    data: new graphql_1.GraphQLNonNull(exports.GraphQlUserResponse)
});
exports.addFollower = new graphql_1.GraphQLList(exports.GraphQlUserResponse);
