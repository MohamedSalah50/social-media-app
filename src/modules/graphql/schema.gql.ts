import { GraphQLObjectType, GraphQLSchema } from "graphql";
import { userGqlSchema } from "../user";
import postSchemaGql from "../post/post.schema.gql";
import { PostGqlSchema } from "../post";


const query = new GraphQLObjectType({
    name: "RootSchemaQuery",
    description: "optional text",
    fields: {
        ...userGqlSchema.registerQuery(),
        ...postSchemaGql.registerQuery()
    },
})



const mutation = new GraphQLObjectType({
    name: "RootSchemaMutation",
    description: "hold all RootSchemamutations fields",
    fields: {
        ...userGqlSchema.registerMutation(),
        ...PostGqlSchema.registerMutation()
    },
})


export const schema = new GraphQLSchema({ query, mutation })