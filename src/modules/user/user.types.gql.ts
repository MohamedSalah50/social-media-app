import { GraphQLEnumType, GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import { GenderEnum } from "../../db/models";
import { GraphQlUniformResponse } from "../graphql/types.gql";

export const GraphQlGenderEnum = new GraphQLEnumType({
    name: "GenderEnum",
    values: {
        male: { value: GenderEnum.male },
        female: { value: GenderEnum.female }
    }
})


export const GraphQlUserResponse = new GraphQLObjectType({
    name: "oneUserResponse",
    fields: {
        id: { type: GraphQLID },
        name: { type: new GraphQLNonNull(GraphQLString), description: "userName" },
        email: { type: GraphQLString },
        gender: { type: GraphQlGenderEnum },
        followers: { type: new GraphQLList(GraphQLID) },
    }
})


export const allUsers = new GraphQLList(GraphQlUserResponse);
export const searchUser = GraphQlUniformResponse({
    name: "searchUser",
    data: new GraphQLNonNull(GraphQlUserResponse)
})

export const addFollower = new GraphQLList(GraphQlUserResponse)