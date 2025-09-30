"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = void 0;
const graphql_1 = require("graphql");
const user_1 = require("../user");
const query = new graphql_1.GraphQLObjectType({
    name: "RootSchemaQuery",
    description: "optional text",
    fields: {
        ...user_1.userGqlSchema.registerQuery()
    },
});
const mutation = new graphql_1.GraphQLObjectType({
    name: "RootSchemaMutation",
    description: "hold all RootSchemamutations fields",
    fields: {
        ...user_1.userGqlSchema.registerMutation()
    },
});
exports.schema = new graphql_1.GraphQLSchema({ query, mutation });
