import { z } from "zod"
import { AllowCommentsEnum, AvailabilityEnum, likeActionEnum } from "../../db/models/post.model"
import { generalFields } from "../../middleware/validation.middleware"
import { fileValidation } from "../../utils/multer/cloud.multer"


export const createPost = {

    body: z.strictObject({
        content: z.string().min(2).max(5000).optional(),
        attachments: z.array(generalFields.file(fileValidation.image)).max(2).optional(),
        allowComments: z.enum(AllowCommentsEnum).default(AllowCommentsEnum.allow),
        availability: z.enum(AvailabilityEnum).default(AvailabilityEnum.public),
        tags: z.array(generalFields.id).max(10).optional()
    }).superRefine((data, ctx) => {
        if (!data.attachments?.length && !data.content) {
            ctx.addIssue({ code: "custom", message: "content or attachments is required", path: ["content"] })
        }
        if (data.tags?.length && data.tags.length !== [...new Set(data.tags)].length) {
            ctx.addIssue({ code: "custom", message: "tags must be unique", path: ["tags"] })
        }
    })
}


export const updatePost = {
    params: z.strictObject({
        postId: generalFields.id
    }),
    body: z.strictObject({
        content: z.string().min(2).max(5000).optional(),
        attachments: z.array(generalFields.file(fileValidation.image)).max(2).optional(),
        allowComments: z.enum(AllowCommentsEnum).optional(),
        availability: z.enum(AvailabilityEnum).optional(),
        tags: z.array(generalFields.id).max(10).optional(),
        removedAttachments: z.array(z.string()).max(2).optional(),
        removedTags: z.array(generalFields.id).max(10).optional(),
    }).superRefine((data, ctx) => {
        if (!Object.values(data).length) {
            ctx.addIssue({ code: "custom", message: "at least one field is required" })
        }

        if (!data.attachments?.length && !data.content) {
            ctx.addIssue({ code: "custom", message: "content or attachments is required", path: ["content"] })
        }
        if (data.tags?.length && data.tags.length !== [...new Set(data.tags)].length) {
            ctx.addIssue({ code: "custom", message: "tags must be unique", path: ["tags"] })
        }
    })
}






export const likePost = {
    params: z.strictObject({
        postId: generalFields.id
    }),
    query: z.strictObject({
        action: z.enum(likeActionEnum).default(likeActionEnum.like)
    })
}