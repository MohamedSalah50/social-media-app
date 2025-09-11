export const verifyEmail = ({ otp, title }: { otp: string; title?: string }): string => {

  return `
  <!DOCTYPE html>
  <html>
  <head>
  <meta charset="UTF-8" />
  <title>Email Verification</title>
  </head>
  <body style="margin:0; padding:0; background:#f5f7fa; font-family:Arial, sans-serif;">
  <table width="100%" cellspacing="0" cellpadding="0" bgcolor="#f5f7fa">
  <tr>
  <td>
  <table width="600" cellpadding="0" cellspacing="0" bgcolor="#ffffff" align="center" style="margin:40px auto; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
  
            <!-- Header -->
            <tr>
            <td bgcolor="#2d89ef" style="padding:20px; text-align:center; color:#fff; font-size:24px; font-weight:bold;">
            MyApp
            </td>
            </tr>

            <!-- Body -->
            <tr>
            <td style="padding:30px; color:#333; font-size:16px; line-height:1.6;">
                <h2 style="margin-top:0;">${title},</h2>
                <p>Thanks for signing up! Please use the OTP below to verify your email address:</p>
                
                <div style="margin:30px 0; text-align:center;">
                <span style="display:inline-block; font-size:32px; font-weight:bold; background:#2d89ef; color:#fff; padding:12px 32px; border-radius:8px; letter-spacing:4px;">
                ${otp}
                </span>
                </div>
                
                <p style="color:#777;">This code will expire in <b>10 minutes</b>. Do not share it with anyone.</p>
                </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                <td bgcolor="#f0f0f0" style="padding:20px; text-align:center; font-size:14px; color:#777;">
                &copy; ${new Date().getFullYear()} MyApp. All rights reserved.
                </td>
            </tr>
            
          </table>
          </td>
          </tr>
          </table>
          </body>
          </html>
          `
};


