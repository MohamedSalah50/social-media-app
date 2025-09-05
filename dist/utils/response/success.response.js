"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = void 0;
const successResponse = ({ res, message = "done", statusCode = 200, data, }) => res.status(statusCode).json({ message, data });
exports.successResponse = successResponse;
