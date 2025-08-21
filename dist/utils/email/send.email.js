"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const sendEmail = async ({ from = process.env.EMAIL, to, cc = [], bcc = [], subject, text = "", html = "", attachments = [], }) => {
    const transporter = nodemailer_1.default.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
    await transporter.sendMail({
        from: `MyApp <${from}>`,
        to,
        cc,
        bcc,
        subject,
        text,
        html,
        attachments,
    });
    // console.log("✅ Email sent:", info.messageId);
};
exports.sendEmail = sendEmail;
