import jwt, { SignOptions } from "jsonwebtoken";

interface GenerateTokenArgs {
    payload: object;
    type: "access" | "refresh";
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export const generateToken = ({ payload, type }: GenerateTokenArgs): string => {
    let signature = "";
    let options: SignOptions = {};

    if (type === "access") {
        signature = JWT_SECRET || "lbjbei";
        options = { expiresIn: "15m" };
    }

    if (type === "refresh") {
        signature = JWT_REFRESH_SECRET || "kwmkmkmocmmwcwemo";
        options = { expiresIn: "7d" };
    }

    return jwt.sign(payload, signature, options);
};
