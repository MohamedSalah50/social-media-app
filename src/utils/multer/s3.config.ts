import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  DeleteObjectsCommandOutput,
  GetObjectCommand,
  GetObjectCommandOutput,
  ListObjectsCommand,
  ListObjectsCommandOutput,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { v4 as uuid } from "uuid";
import { storageEnum } from "./cloud.multer";
import { createReadStream } from "node:fs";
import { BadRequest } from "../response/error.response";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3config = () => {
  return new S3Client({
    region: process.env.S3_REGION as string,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY as string,
      secretAccessKey: process.env.S3_SECRET_KEY as string,
    },
  });
};

export const uploadFile = async ({
  storageAppraoch = storageEnum.memory,
  Bucket = process.env.S3_BUCKET_NAME,
  ACL = "private",
  path = "general",
  file,
}: {
  storageAppraoch?: storageEnum;
  Bucket?: string;
  ACL?: ObjectCannedACL;
  path?: string;
  file: Express.Multer.File;
}): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket,
    ACL,
    Key: `${process.env.APPLICATION_NAME}/${path}/${uuid()}/_${
      file.originalname
    }` as string,
    Body:
      storageAppraoch === storageEnum.memory
        ? file.buffer
        : createReadStream(file.path),
    ContentType: file.mimetype,
  });

  await s3config().send(command);

  if (!command?.input?.Key) {
    throw new BadRequest("fail to upload this file");
  }

  return command.input.Key;
};

export const uploadLargeFile = async ({
  storageAppraoch = storageEnum.memory,
  Bucket = process.env.S3_BUCKET_NAME,
  ACL = "private",
  path = "general",
  file,
}: {
  storageAppraoch?: storageEnum;
  Bucket?: string;
  ACL?: ObjectCannedACL;
  path?: string;
  file: Express.Multer.File;
}): Promise<string> => {
  const upload = new Upload({
    client: s3config(),
    params: {
      Bucket,
      ACL,
      Key: `${process.env.APPLICATION_NAME}/${path}/${uuid()}/_${
        file.originalname
      }` as string,
      Body:
        storageAppraoch === storageEnum.memory
          ? file.buffer
          : createReadStream(file.path),
      ContentType: file.mimetype,
    },
  });
  upload.on("httpUploadProgress", (progress) => {
    console.log("upload file progress is ", progress);
  });

  const { Key } = await upload.done();
  if (!Key) {
    throw new BadRequest("fail to generate this key");
  }
  return Key;
};

export const uploadFiles = async ({
  storageAppraoch = storageEnum.memory,
  Bucket = process.env.S3_BUCKET_NAME as string,
  ACL = "private",
  path = "general",
  files,
  useLarge = false,
}: {
  storageAppraoch?: storageEnum;
  Bucket?: string;
  ACL?: ObjectCannedACL;
  path?: string;
  files: Express.Multer.File[];
  useLarge?: boolean;
}): Promise<string[]> => {
  let urls: string[] = [];

  if (useLarge) {
    urls = await Promise.all(
      files.map((file) => {
        return uploadLargeFile({
          storageAppraoch,
          Bucket,
          ACL,
          path,
          file,
        });
      })
    );
  } else {
    urls = await Promise.all(
      files.map((file) => {
        return uploadFile({
          storageAppraoch,
          Bucket,
          ACL,
          path,
          file,
        });
      })
    );
  }

  return urls;
};

// export const uploadLargeFiles = async ({
//   storageAppraoch = storageEnum.disk,
//   Bucket = process.env.S3_BUCKET_NAME as string,
//   ACL = "private",
//   path = "general",
//   files,
// }: {
//   storageAppraoch?: storageEnum;
//   Bucket?: string;
//   ACL?: ObjectCannedACL;
//   path?: string;
//   files: Express.Multer.File[];
// }): Promise<string[]> => {
//   let urls: string[] = [];

//   urls = await Promise.all(
//     files.map((file) => {
//       return uploadLargeFile({
//         storageAppraoch,
//         Bucket,
//         ACL,
//         path,
//         file,
//       });
//     })
//   );

//   return urls;
// };

export const createSignedUploadLink = async ({
  Bucket = process.env.S3_BUCKET_NAME as string,
  path = "general",
  expiresIn = Number(process.env.AWS_PRE_SIGNED_URL_EXPIRES_IN_SECONDS),
  ContentType,
  OriginalName,
}: {
  Bucket?: string;
  path?: string;
  expiresIn?: number;
  ContentType: string;
  OriginalName: string;
}): Promise<{ url: string; Key: string }> => {
  const command = new PutObjectCommand({
    Bucket,
    Key: `${process.env.APPLICATION_NAME}/${path}/${uuid()}/_${OriginalName}`,
    ContentType,
  });
  const url = await getSignedUrl(s3config(), command, { expiresIn });

  if (!url || !command?.input?.Key) {
    throw new BadRequest("fail to create preSignedUrl");
  }
  return { url, Key: command.input.Key };
};

export const createGetSignedLink = async ({
  Bucket = process.env.S3_BUCKET_NAME as string,
  expiresIn = Number(process.env.AWS_PRE_SIGNED_URL_EXPIRES_IN_SECONDS),
  Key,
  downloadName = "dummy",
  download = "flase",
}: {
  Bucket?: string;
  expiresIn?: number;
  Key: string;
  downloadName?: string;
  download?: string;
}): Promise<string> => {
  const command = new GetObjectCommand({
    Key,
    Bucket,
    ResponseContentDisposition:
      download === "true"
        ? `attachment; filename=${downloadName || Key.split("/").pop()} `
        : undefined,
  });
  const url = await getSignedUrl(s3config(), command, { expiresIn });

  if (!url) {
    throw new BadRequest("fail to create this upload preSignedUrl");
  }
  return url;
};

export const getFile = async ({
  Bucket = process.env.S3_BUCKET_NAME as string,
  key,
}: {
  Bucket?: string;
  key: string;
}): Promise<GetObjectCommandOutput> => {
  const command = new GetObjectCommand({
    Key: key,
    Bucket,
  });
  return await s3config().send(command);
};

export const deleteFile = async ({
  Key,
  Bucket = process.env.S3_BUCKET_NAME,
}: {
  Key: string;
  Bucket?: string;
}) => {
  const command = new DeleteObjectCommand({
    Key,
    Bucket,
  });
  return await s3config().send(command);
};

export const deleteFiles = async ({
  Bucket = process.env.S3_BUCKET_NAME,
  urls,
  Quiet = false,
}: {
  Bucket?: string;
  urls: string[];
  Quiet?: boolean;
}): Promise<DeleteObjectsCommandOutput> => {
  const Objects = urls.map((url) => {
    return { Key: url };
  });
  const command = new DeleteObjectsCommand({
    Bucket,
    Delete: {
      Objects,
      Quiet,
    },
  });
  return await s3config().send(command);
};

export const listDirectoryFiles = async ({
  Bucket = process.env.S3_BUCKET_NAME as string,
  path,
}: {
  Bucket?: string;
  path: string;
}): Promise<ListObjectsCommandOutput> => {
  const command = new ListObjectsCommand({
    Bucket,
    Prefix: `${process.env.APPLICATION_NAME}/${path}`,
  });
  return await s3config().send(command);
};

export const deleteFolderByPrefix = async ({
  Bucket = process.env.S3_BUCKET_NAME as string,
  path,
  Quiet = false,
}: {
  Bucket?: string;
  path: string;
  Quiet?: boolean;
}): Promise<DeleteObjectsCommandOutput> => {
  const fileList = await listDirectoryFiles({
    path,
    Bucket,
  });
  if (!fileList?.Contents?.length) {
    throw new BadRequest("empty directories");
  }

  const urls: string[] = fileList.Contents.map((file) => file.Key as string);

  return await deleteFiles({ urls, Bucket, Quiet });
};
