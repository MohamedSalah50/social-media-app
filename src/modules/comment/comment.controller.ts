import { Router } from "express";
import { authentication } from "../../middleware/authentication.middleware";
import { cloudFileUpload, fileValidation } from "../../utils/multer/cloud.multer";
import { validation } from "../../middleware/validation.middleware";
import * as validators from "./comment.validation";
import commentService from "./comment.service";

const router = Router({ mergeParams: true });


router.post("/", authentication(),
    cloudFileUpload({ validation: fileValidation.image }).array("attachments", 2),
    validation(validators.createComment),
    commentService.createComment
)


router.post("/:commentId/create-reply-on-comment", authentication(),
    cloudFileUpload({ validation: fileValidation.image }).array("attachments", 2),
    validation(validators.createReplyOnComment),
    commentService.createReplyOnComment
)

export default router;