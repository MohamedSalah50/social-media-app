import { Router } from "express";
import postService from "./post.service";
import { authentication } from "../../middleware/authentication.middleware";
import { validation } from "../../middleware/validation.middleware";
import * as validators from "./post.validation";
import { cloudFileUpload, fileValidation } from "../../utils/multer/cloud.multer";
import { commentRouter } from "../comment";

const router = Router();

router.use("/:postId/comment", commentRouter)

router.get("/", authentication(), postService.postList);

router.post("/create-post", authentication(),
    cloudFileUpload({ validation: fileValidation.image }).array("attachments", 2),
    validation(validators.createPost), postService.createPost)


router.patch("/:postId", authentication(),
    cloudFileUpload({ validation: fileValidation.image }).array("attachments", 2),
    validation(validators.updatePost), postService.updatePost)

router.patch("/:postId/like", authentication(), validation(validators.likePost), postService.likePost)

router.delete("/:postId/freeze", authentication(), postService.freezePost)
router.delete("/:postId/hard-delete", authentication(), postService.hardDeletePost)

export default router;