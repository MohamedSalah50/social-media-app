import { GraphQLObjectType, GraphQLSchema } from "graphql";
import { userGqlSchema } from "../user";


const query = new GraphQLObjectType({
    name: "RootSchemaQuery",
    description: "optional text",
    fields: {
        ...userGqlSchema.registerQuery()
    },
})



const mutation = new GraphQLObjectType({
    name: "RootSchemaMutation",
    description: "hold all RootSchemamutations fields",
    fields: {
        ...userGqlSchema.registerMutation()
    },
})


export const schema = new GraphQLSchema({ query, mutation })