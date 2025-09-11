import { Router } from "express";
import postService from "./post.service";
import { authentication } from "../../middleware/authentication.middleware";
import { validation } from "../../middleware/validation.middleware";
import * as validators from "./post.validation";
import { cloudFileUpload, fileValidation } from "../../utils/multer/cloud.multer";

const router = Router();

router.post("/create-post", authentication(),
    cloudFileUpload({ validation: fileValidation.image}).array("attachments", 2),
    validation(validators.createPost), postService.createPost)

    router.patch("/:postId/like",authentication(), validation(validators.likePost), postService.likePost)

export default router;