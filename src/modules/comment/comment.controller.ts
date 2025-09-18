import { Router } from "express";
import { authentication } from "../../middleware/authentication.middleware";
import { cloudFileUpload, fileValidation } from "../../utils/multer/cloud.multer";
import { validation } from "../../middleware/validation.middleware";
import * as validators from "./comment.validation";
import commentService from "./comment.service";

const router = Router({ mergeParams: true });

router.get("/:commentId", authentication(), commentService.getCommentById)

router.get("/:commentId/comment-with-reply", authentication(), commentService.getCommentWithReplies)

router.post("/", authentication(),
    cloudFileUpload({ validation: fileValidation.image }).array("attachments", 2),
    validation(validators.createComment),
    commentService.createComment
)

router.patch("/:commentId/update", authentication(),
    cloudFileUpload({ validation: fileValidation.image }).array("attachments", 2),
    validation(validators.updateComment), commentService.updateComment)


router.post("/:commentId/create-reply-on-comment", authentication(),
    cloudFileUpload({ validation: fileValidation.image }).array("attachments", 2),
    validation(validators.createReplyOnComment),
    commentService.createReplyOnComment
)

router.delete("/:commentId/freeze", authentication(), commentService.freezeComment)
router.delete("/:commentId/hard-delete", authentication(), commentService.hardDeleteComment)

export default router;