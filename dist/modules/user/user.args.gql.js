"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFollower = exports.searchUser = exports.allUsers = exports.welcome = void 0;
const graphql_1 = require("graphql");
const user_types_gql_1 = require("./user.types.gql");
exports.welcome = {
    name: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) }
};
exports.allUsers = {
    gender: { type: user_types_gql_1.GraphQlGenderEnum }
};
exports.searchUser = {
    email: {
        type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
        description: "email of user"
    },
};
exports.addFollower = {
    friendId: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
    myId: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
};
