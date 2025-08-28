import { EventEmitter } from "events";
import { sendEmail } from "../email/send.email";
import Mail from "nodemailer/lib/mailer";
import { verifyEmail } from "../email/template.email";

export const emailEmitter = new EventEmitter();

interface IEmail extends Mail.Options {
  otp: string
}

emailEmitter.on("sendConfirmEmail", async (data: IEmail) => {
  try {
    data.subject = "confirm-email";
    data.html = verifyEmail({ otp: data.otp, title: "confirm your email" })
    await sendEmail(data);
  } catch (err) {
    console.error("❌ email failed:", err);
  }
});

emailEmitter.on("forgotPassword", async (data) => {
  try {
    await sendEmail(data);
  } catch (err) {
    console.error("❌ email failed:", err);
  }
});
