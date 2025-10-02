"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFollower = exports.searchUser = exports.allUsers = exports.welcome = exports.GraphQlUserResponse = exports.GraphQlProviderEnum = exports.GraphQlRoleEnum = exports.GraphQlGenderEnum = void 0;
const graphql_1 = require("graphql");
const models_1 = require("../../db/models");
const types_gql_1 = require("../graphql/types.gql");
const token_security_1 = require("../../utils/security/token.security");
exports.GraphQlGenderEnum = new graphql_1.GraphQLEnumType({
    name: "GenderEnum",
    values: {
        male: { value: models_1.GenderEnum.male },
        female: { value: models_1.GenderEnum.female }
    }
});
exports.GraphQlRoleEnum = new graphql_1.GraphQLEnumType({
    name: "RoleEnum",
    values: {
        user: { value: token_security_1.RoleEnum.user },
        admin: { value: token_security_1.RoleEnum.admin },
        superAdmin: { value: token_security_1.RoleEnum.superAdmin },
    }
});
exports.GraphQlProviderEnum = new graphql_1.GraphQLEnumType({
    name: "ProviderEnum",
    values: {
        Google: { value: models_1.ProviderEnum.Google },
        System: { value: models_1.ProviderEnum.System }
    }
});
exports.GraphQlUserResponse = new graphql_1.GraphQLObjectType({
    name: "oneUserResponse",
    fields: {
        _id: { type: graphql_1.GraphQLID },
        firstName: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        lastName: { type: graphql_1.GraphQLString },
        username: { type: graphql_1.GraphQLString },
        slug: { type: graphql_1.GraphQLString },
        email: { type: graphql_1.GraphQLString },
        confirmEmailOtp: { type: graphql_1.GraphQLString },
        confirmedAt: { type: graphql_1.GraphQLString },
        password: { type: graphql_1.GraphQLString },
        resetPasswordOtp: { type: graphql_1.GraphQLString },
        changeCredentialsTime: { type: graphql_1.GraphQLString },
        phone: { type: graphql_1.GraphQLString },
        profileImage: { type: graphql_1.GraphQLString },
        tempProfileImage: { type: graphql_1.GraphQLString },
        coverImages: { type: new graphql_1.GraphQLList(graphql_1.GraphQLString) },
        freezedAt: { type: graphql_1.GraphQLString },
        freezedBy: { type: graphql_1.GraphQLID },
        restoredAt: { type: graphql_1.GraphQLString },
        restoredBy: { type: graphql_1.GraphQLID },
        address: { type: graphql_1.GraphQLString },
        gender: { type: exports.GraphQlGenderEnum },
        role: { type: exports.GraphQlRoleEnum },
        createdAt: { type: graphql_1.GraphQLString },
        updatedAt: { type: graphql_1.GraphQLString },
        provider: { type: exports.GraphQlProviderEnum },
        tempEmail: { type: graphql_1.GraphQLString },
        oldEmailOtp: { type: graphql_1.GraphQLString },
        newEmailOtp: { type: graphql_1.GraphQLString },
        loginTempOtp: { type: graphql_1.GraphQLString },
        temp2faOtp: { type: graphql_1.GraphQLString },
        is2faEnabled: { type: graphql_1.GraphQLBoolean },
        friends: { type: new graphql_1.GraphQLList(graphql_1.GraphQLID) },
        blocked: { type: new graphql_1.GraphQLList(graphql_1.GraphQLID) },
    }
});
exports.welcome = new graphql_1.GraphQLNonNull(graphql_1.GraphQLString);
exports.allUsers = new graphql_1.GraphQLList(exports.GraphQlUserResponse);
exports.searchUser = (0, types_gql_1.GraphQlUniformResponse)({
    name: "searchUser",
    data: new graphql_1.GraphQLNonNull(exports.GraphQlUserResponse)
});
exports.addFollower = new graphql_1.GraphQLList(exports.GraphQlUserResponse);
