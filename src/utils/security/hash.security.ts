import bcrypt from "bcryptjs";

interface IHashInput {
  plainText?: string;
  saltRound?: number;
}

interface ICompareInput {
  plainText?: string;
  cipherText?: string;
}

// Hash
export const generateHash = ({
  plainText = "",
  saltRound = Number(process.env.SALT_ROUND) || 10,
}: IHashInput): string => {
  return bcrypt.hashSync(plainText, saltRound);
};

// Compare Hash
export const compareHash = async ({
  plainText = "",
  cipherText = "",
}: ICompareInput): Promise<boolean> => {
  return bcrypt.compare(plainText, cipherText);
};
