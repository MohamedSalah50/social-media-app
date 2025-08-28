import nodemailer, { Transporter } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import Mail from "nodemailer/lib/mailer";
import { BadRequest } from "../response/error.response";

export const sendEmail = async (data: Mail.Options): Promise<void> => {

    if (!data.html && !data.attachments?.length && !data.text) {
        throw new BadRequest("missing email content")
    }
    const transporter: Transporter<
        SMTPTransport.SentMessageInfo | SMTPTransport.Options
    > = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL as string,
            pass: process.env.EMAIL_PASSWORD as string,
        },
    });

    await transporter.sendMail({
        ...data,
        from: `${process.env.APPLICATION_NAME} 🍀🚀 <${process.env.EMAIL as string}>`,
    });

    // console.log("Message sent:", info.messageId);
};
