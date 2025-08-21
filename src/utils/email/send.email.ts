import nodemailer from "nodemailer";

interface EmailOptions {
    from?: string;
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: any[];
}

export const sendEmail = async ({
    from = process.env.EMAIL,
    to,
    cc = [],
    bcc = [],
    subject,
    text = "",
    html = "",
    attachments = [],
}: EmailOptions) => {
    const transporter = nodemailer.createTransport({
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
