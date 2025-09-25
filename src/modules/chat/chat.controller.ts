import { Router } from "express"
import { authentication } from "../../middleware/authentication.middleware";
import { validation } from "../../middleware/validation.middleware";
import * as validators from "./chat.validation"
import { ChatService } from "./chat.service";
import { cloudFileUpload, fileValidation } from "../../utils/multer/cloud.multer";
const chatService = new ChatService();

const router = Router({ mergeParams: true });

router.get("/", authentication(), validation(validators.getChat), chatService.getChat);

router.get("/group/:groupId", authentication(),
    validation(validators.getgroup), chatService.getChattingGroup);

router.post("/group", authentication(),
    cloudFileUpload({ validation: fileValidation.image }).single("attachments"),
    validation(validators.createChatGroup),
    chatService.createChattingGroup);

export default router;