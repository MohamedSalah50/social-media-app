import { GraphQLEnumType, GraphQLID, GraphQLInt, GraphQLNonNull } from "graphql";
import { likeActionEnum } from "../../db/models";


export const allPosts = {
    page: { type: new GraphQLNonNull(GraphQLInt) },
    size: { type: new GraphQLNonNull(GraphQLInt) },
}

export const likePost = {
    postId: { type: new GraphQLNonNull(GraphQLID) },
    action: {
        type: new GraphQLNonNull(new GraphQLEnumType({
            name: "likePostAction",
            values: {
                like: { value: likeActionEnum.like },
                unlike: { value: likeActionEnum.like }
            }
        }))
    }
}

