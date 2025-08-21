import { EventEmitter } from "events";
import { sendEmail } from "../email/send.email";

export const emailEmitter = new EventEmitter();

emailEmitter.on("sendConfirmEmail", async (data) => {
  try {
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
