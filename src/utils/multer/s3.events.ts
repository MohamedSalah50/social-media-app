import { EventEmitter } from "stream";
import { userRepository } from "../../db/repository/user.repository";
import { UserModel } from "../../db/models/user.model";
import { deleteFile, getFile } from "./s3.config";

const s3event = new EventEmitter();

s3event.on("trackProfileImageUpload", (data) => {
  setTimeout(async () => {
    const userModel = new userRepository(UserModel);
    try {
      await getFile({ key: data.oldKey });
      await userModel.updateOne({
        filter: { _id: data.userId },
        update: {
          $unset: { tempProfileImage: 1 },
        },
      });
      await deleteFile({ Key: data.oldKey });
      console.log("done 👌");
    } catch (error: any) {
      console.log(error);
      if (error.code === "NoSuchKey") {
        await userModel.updateOne({
          filter: { _id: data.userId },
          update: {
            profileImage: data.oldKey,
            $unset: { tempProfileImage: 1 },
          },
        });
      }
    }
  }, data.expiresIn || Number(process.env.AWS_PRE_SIGNED_URL_EXPIRES_IN_SECONDS) * 1000);
});

export default s3event;
