"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailEmitter = void 0;
const events_1 = require("events");
const send_email_1 = require("../email/send.email");
exports.emailEmitter = new events_1.EventEmitter();
exports.emailEmitter.on("sendConfirmEmail", async (data) => {
    try {
        await (0, send_email_1.sendEmail)(data);
    }
    catch (err) {
        console.error("❌ email failed:", err);
    }
});
exports.emailEmitter.on("forgotPassword", async (data) => {
    try {
        await (0, send_email_1.sendEmail)(data);
    }
    catch (err) {
        console.error("❌ email failed:", err);
    }
});
