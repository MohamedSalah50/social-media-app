import { GraphQLBoolean, GraphQLEnumType, GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import { GenderEnum, ProviderEnum } from "../../db/models";
import { GraphQlUniformResponse } from "../graphql/types.gql";
import { RoleEnum } from "../../utils/security/token.security";

export const GraphQlGenderEnum = new GraphQLEnumType({
    name: "GenderEnum",
    values: {
        male: { value: GenderEnum.male },
        female: { value: GenderEnum.female }
    }
})

export const GraphQlRoleEnum = new GraphQLEnumType({
    name: "RoleEnum",
    values: {
        user: { value: RoleEnum.user },
        admin: { value: RoleEnum.admin },
        superAdmin: { value: RoleEnum.superAdmin },
    }
})


export const GraphQlProviderEnum = new GraphQLEnumType({
    name: "ProviderEnum",
    values: {
        Google: { value: ProviderEnum.Google },
        System: { value: ProviderEnum.System }
    }
})


export const GraphQlUserResponse = new GraphQLObjectType({
    name: "oneUserResponse",
    fields: {
        _id: { type: GraphQLID },
        firstName: { type: new GraphQLNonNull(GraphQLString) },
        lastName: { type: GraphQLString },
        username: { type: GraphQLString },
        slug: { type: GraphQLString },
        email: { type: GraphQLString },
        confirmEmailOtp: { type: GraphQLString },
        confirmedAt: { type: GraphQLString },
        password: { type: GraphQLString },
        resetPasswordOtp: { type: GraphQLString },
        changeCredentialsTime: { type: GraphQLString },
        phone: { type: GraphQLString },
        profileImage: { type: GraphQLString },
        tempProfileImage: { type: GraphQLString },
        coverImages: { type: new GraphQLList(GraphQLString) },
        freezedAt: { type: GraphQLString },
        freezedBy: { type: GraphQLID },
        restoredAt: { type: GraphQLString },
        restoredBy: { type: GraphQLID },
        address: { type: GraphQLString },
        gender: { type: GraphQlGenderEnum },
        role: { type: GraphQlRoleEnum },
        createdAt: { type: GraphQLString },
        updatedAt: { type: GraphQLString },
        provider: { type: GraphQlProviderEnum },
        tempEmail: { type: GraphQLString },
        oldEmailOtp: { type: GraphQLString },
        newEmailOtp: { type: GraphQLString },
        loginTempOtp: { type: GraphQLString },
        temp2faOtp: { type: GraphQLString },
        is2faEnabled: { type: GraphQLBoolean },
        friends: { type: new GraphQLList(GraphQLID) },
        blocked: { type: new GraphQLList(GraphQLID) },
    }
})

export const welcome = new GraphQLNonNull(GraphQLString);
export const allUsers = new GraphQLList(GraphQlUserResponse);
export const searchUser = GraphQlUniformResponse({
    name: "searchUser",
    data: new GraphQLNonNull(GraphQlUserResponse)
})

export const addFollower = new GraphQLList(GraphQlUserResponse)