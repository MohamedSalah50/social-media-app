import CryptoJS from "crypto-js";

interface IEncryptionInput {
  plainText?: string;
  secretKey?: string;
}

interface IDecryptionInput {
  cipherText?: string;
  secretKey?: string;
}

// Encrypt
export const generateEncryption = ({
  plainText = "",
  secretKey = process.env.ENC_SECRET_KEY || "default_secret",
}: IEncryptionInput): string => {
  return CryptoJS.AES.encrypt(plainText, secretKey).toString();
};

// Decrypt
export const decryptEncryption = ({
  cipherText = "",
  secretKey = process.env.ENC_SECRET_KEY || "default_secret",
}: IDecryptionInput): string => {
  return CryptoJS.AES.decrypt(cipherText, secretKey).toString(CryptoJS.enc.Utf8);
};
