import { GraphQLEnumType, GraphQLID, GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString } from "graphql";
import { AllowCommentsEnum, AvailabilityEnum } from "../../db/models";
import { GraphQlUserResponse } from "../user";


export const GraphQlAllowCommentsEnum = new GraphQLEnumType({
    name: "AllowCommentsEnum",
    values: {
        allow: { value: AllowCommentsEnum.allow },
        deny: { value: AllowCommentsEnum.deny }
    }
})

export const GraphQlAvailabilityEnum = new GraphQLEnumType({
    name: "AvailabilityEnum",
    values: {
        friends: { value: AvailabilityEnum.friends },
        onlyMe: { value: AvailabilityEnum.onlyMe },
        public: { value: AvailabilityEnum.public },
    }
})

export const GraphQlOnePostResponse = new GraphQLObjectType({
    name: "onePostResponse",
    fields: {
        _id: { type: GraphQLID },
        content: { type: GraphQLString },
        attachments: { type: new GraphQLList(GraphQLString) },
        assetsFolderId: { type: GraphQLString },

        allowComments: { type: GraphQlAllowCommentsEnum },
        availability: { type: GraphQlAvailabilityEnum },

        likes: { type: new GraphQLList(GraphQLID) },
        tags: { type: new GraphQLList(GraphQLID) },


        createdBy: { type: GraphQlUserResponse },

        freezedAt: { type: GraphQLString },
        freezedBy: { type: GraphQLID },
        restoredAt: { type: GraphQLString },
        restoredBy: { type: GraphQLID },



        createdAt: { type: GraphQLString },
        updatedAt: { type: GraphQLString },
    }
})


export const allPosts = new GraphQLObjectType({
    name: "allPosts",
    fields: {
        docsCount: { type: GraphQLInt },
        limit: { type: GraphQLInt },
        page: { type: GraphQLInt },
        currentPage: { type: GraphQLInt },
        result: { type: new GraphQLList(GraphQlOnePostResponse) }
    }
})