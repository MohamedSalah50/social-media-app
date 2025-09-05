import { Router } from "express";
import {
  authentication,
  authorization,
} from "../../middleware/authentication.middleware";
import UserService from "./user.service";
import { endpoint } from "./user.authorization";
import * as validators from "./user.validation";
import { validation } from "../../middleware/validation.middleware";
import { tokenEnum } from "../../utils/security/token.security";
import {
  cloudFileUpload,
  fileValidation,
  storageEnum,
} from "../../utils/multer/cloud.multer";

const router = Router();

router.delete(
  "{/:userId}/freeze-account",
  authentication(),
  validation(validators.freezeAccount),
  UserService.freezeAccount
);

router.delete(
  "/:userId/hard-delete",
  authorization(endpoint.hardDelete),
  validation(validators.hardDelete),
  UserService.hardDeleteAccount
);

router.patch(
  "/:userId/restore-account",
  authorization(endpoint.restoreAccount),
  UserService.restoreAccount
);

router.get("/profile", authorization(endpoint.profile), UserService.profile);
router.patch(
  "/profile-image",
  authentication(),
  cloudFileUpload({
    validation: fileValidation.image,
    storageAppraoch: storageEnum.disk,
  }).single("image"),
  UserService.profileImage
);
router.patch(
  "/profile-cover-image",
  authentication(),
  cloudFileUpload({
    validation: fileValidation.image,
    storageAppraoch: storageEnum.disk,
  }).array("images", 2),
  UserService.profileCoverImage
);
router.post(
  "/refresh-token",
  authentication(tokenEnum.refresh),
  UserService.refreshToken
);
router.post(
  "/logout",
  authentication(),
  validation(validators.logout),
  UserService.logout
);

export default router;
