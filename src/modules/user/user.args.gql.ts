import { GraphQLNonNull, GraphQLString } from "graphql";
import { GraphQlGenderEnum } from "./user.types.gql";


export const welcome = {
    name: { type: new GraphQLNonNull(GraphQLString) }
}

export const allUsers = {
    gender: { type: GraphQlGenderEnum }
}

export const searchUser = {
    email: {
        type: new GraphQLNonNull(GraphQLString),
        description: "email of user"
    },
}

export const addFollower = {
    friendId: { type: new GraphQLNonNull(GraphQLString) },
    myId: { type: new GraphQLNonNull(GraphQLString) },
}