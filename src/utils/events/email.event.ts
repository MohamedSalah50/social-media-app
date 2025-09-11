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


emailEmitter.on("send-tags", async (data: IEmail) => {
  try {
    data.subject = "someone tagged you";
    data.html = verifyEmail({ otp: data.otp, title: "you have been tagged" })
    await sendEmail(data);
  } catch (err) {
    console.error("❌ email failed:", err);
  }
});



emailEmitter.on("sendLoginOtp", async (data: IEmail) => {
  try {
    data.subject = "confirmation-login";
    data.html = verifyEmail({ otp: data.otp, title: "confirm your email" })
    await sendEmail(data);
  } catch (err) {
    console.error("❌ email failed:", err);
  }
});


emailEmitter.on("forgotPassword", async (data) => {
  try {
    data.subject = "forgot-password";
    data.html = verifyEmail({ otp: data.otp, title: "reset your password" })
    await sendEmail(data);
  } catch (err) {
    console.error("❌ email failed:", err);
  }
});
