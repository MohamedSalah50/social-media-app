"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endpoint = void 0;
const token_security_1 = require("../../utils/security/token.security");
exports.endpoint = {
    profile: [token_security_1.RoleEnum.user, token_security_1.RoleEnum.admin],
    restoreAccount: [token_security_1.RoleEnum.admin],
    hardDelete: [token_security_1.RoleEnum.admin]
};
