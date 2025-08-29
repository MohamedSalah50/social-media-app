import { NextFunction, Request, Response } from "express"
import { decodeToken, RoleEnum, tokenEnum } from "../utils/security/token.security"
import { BadRequest, ForbiddenException } from "../utils/response/error.response"

export const authentication = (tokenType: tokenEnum = tokenEnum.access) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.headers.authorization) {
            throw new BadRequest("validation error",
                {
                    key: "headers",
                    issues: [{ path: "authorization", message: "Missing authorization header" }]
                })
        }
        const { decoded, user } = await decodeToken({ authorization: req.headers.authorization, tokenType });
        req.user = user;
        req.decoded = decoded;
        next();
    }
}


export const authorization = (
    accessRoles: RoleEnum[] = [],
    tokenType: tokenEnum = tokenEnum.access) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.headers.authorization) {
            throw new BadRequest("validation error",
                {
                    key: "headers",
                    issues: [{ path: "authorization", message: "Missing authorization header" }]
                })
        }
        const { decoded, user } = await decodeToken({ authorization: req.headers.authorization, tokenType });

        if (!accessRoles.includes(user.role as RoleEnum)) {
            throw new ForbiddenException("not authorized account")
        }

        req.user = user;
        req.decoded = decoded;
        next();
    }
}