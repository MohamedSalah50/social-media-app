"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandling = exports.ForbiddenException = exports.UnAuthorizedException = exports.notFoundException = exports.conflict = exports.BadRequest = exports.AppError = void 0;
class AppError extends Error {
    message;
    statusCode;
    cause;
    constructor(message, statusCode, cause) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.cause = cause;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class BadRequest extends AppError {
    constructor(message, cause) {
        super(message, 400, cause);
    }
}
exports.BadRequest = BadRequest;
class conflict extends AppError {
    constructor(message, cause) {
        super(message, 409, cause);
    }
}
exports.conflict = conflict;
class notFoundException extends AppError {
    constructor(message, cause) {
        super(message, 404, cause);
    }
}
exports.notFoundException = notFoundException;
class UnAuthorizedException extends AppError {
    constructor(message, cause) {
        super(message, 401, cause);
    }
}
exports.UnAuthorizedException = UnAuthorizedException;
class ForbiddenException extends AppError {
    constructor(message, cause) {
        super(message, 403, cause);
    }
}
exports.ForbiddenException = ForbiddenException;
const globalErrorHandling = (error, req, res, next) => {
    return res.status(error.statusCode || 500).json({ error_message: error.message || "something went wrong !", stack: process.env.MOOD === "development" ? error.stack : undefined, cause: error.cause });
};
exports.globalErrorHandling = globalErrorHandling;
