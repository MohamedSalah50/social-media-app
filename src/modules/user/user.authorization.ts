import { RoleEnum } from "../../utils/security/token.security";


export const endpoint = {
    profile: [RoleEnum.user, RoleEnum.admin]
}