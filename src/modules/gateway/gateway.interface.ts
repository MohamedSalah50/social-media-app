import { Socket } from "socket.io"
import { HUserDocument } from "../../db/models/user.model"
import { JwtPayload } from "jsonwebtoken"

export interface ICredentials {
  user: Partial<HUserDocument>,
  decoded: JwtPayload
}

export interface IAuthSocket extends Socket {
  credentials?: ICredentials
}

export const connectedSocket = new Map<string, string>();
