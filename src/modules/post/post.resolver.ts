import { HPostDocument, likeActionEnum } from "../../db/models";
import { IAuthGraph } from "../graphql/schema.interface";
import { PostService } from "./post.service";


export class PostResolver {
    private postService: PostService = new PostService()
    constructor() { }

    allPosts = async (parent: unknown,
        args: { page: number, size: number },
        context: IAuthGraph): Promise<{
            docsCount?: number,
            limit?: number,
            page?: number,
            currentPage?: number | undefined,
            result: HPostDocument[]
        }> => {
        return await this.postService.allPosts(args, context.user);
    }


    likePost = async (parent: unknown,
        args: { postId: string, action: likeActionEnum },
        context: IAuthGraph): Promise<HPostDocument> => {
        return await this.postService.likeGraphQlPost(args, context.user);
    }

}