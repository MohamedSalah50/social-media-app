import { GenderEnum } from "../../db/models";
import { IUser, UserService } from "./user.service";

export class UserResolver {
    private userService: UserService = new UserService();

    constructor() { }

    welcome = (parent: unknown, args: any): string => {
        return this.userService.welcome();
    }

    allUsers = (parent: unknown, args: { name: string, gender: GenderEnum }): IUser[] => {
        return this.userService.allUsers(args)
    }

    search = (parent: unknown, args: { email: string }): { message: string, statusCode: number, data: IUser } => {
        return this.userService.search(args)
    }

    addFollower = (parent: unknown, args: { friendId: number, myId: number }): IUser[] => {
        return this.userService.addFollower(args)
    }
}