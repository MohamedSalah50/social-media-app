import { Socket } from "socket.io"
import { HUserDocument } from "../../db/models/user.model"
import { JwtPayload } from "jsonwebtoken"

export interface IAuthSocket extends Socket {
  credentials?: {
    user: Partial<HUserDocument>,
    decoded: JwtPayload
  }
}