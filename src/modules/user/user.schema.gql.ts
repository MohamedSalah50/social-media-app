import * as gqlTypes from "./user.types.gql";
import * as gqlArgs from "./user.args.gql";
import { UserResolver } from "./user.resolver";


class UserGqlSchema {
    constructor() { }

    private userResolver: UserResolver = new UserResolver();

    registerQuery = () => {
        return {

            welcome: {
                type: gqlTypes.welcome,
                args: gqlArgs.welcome,
                description: "this filed return our server welcome message",
                resolve: this.userResolver.welcome
            },

            allUsers: {
                type: gqlTypes.allUsers,
                args: gqlArgs.allUsers,
                resolve: this.userResolver.allUsers
            },


            searchUser: {
                type: gqlTypes.searchUser,
                args: gqlArgs.searchUser,
                resolve: this.userResolver.search
            }
        }
    }

    registerMutation = () => {
        return {
            addFollower: {
                type: gqlTypes.addFollower,
                args: gqlArgs.addFollower,
                resolve: this.userResolver.addFollower
            }
        }
    }
}

export default new UserGqlSchema();