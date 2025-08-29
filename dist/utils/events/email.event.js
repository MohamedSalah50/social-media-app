"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailEmitter = void 0;
const events_1 = require("events");
const send_email_1 = require("../email/send.email");
const template_email_1 = require("../email/template.email");
exports.emailEmitter = new events_1.EventEmitter();
exports.emailEmitter.on("sendConfirmEmail", async (data) => {
    try {
        data.subject = "confirm-email";
        data.html = (0, template_email_1.verifyEmail)({ otp: data.otp, title: "confirm your email" });
        await (0, send_email_1.sendEmail)(data);
    }
    catch (err) {
        console.error("❌ email failed:", err);
    }
});
exports.emailEmitter.on("forgotPassword", async (data) => {
    try {
        data.subject = "forgot-password";
        data.html = (0, template_email_1.verifyEmail)({ otp: data.otp, title: "reset your password" });
        await (0, send_email_1.sendEmail)(data);
    }
    catch (err) {
        console.error("❌ email failed:", err);
    }
});
