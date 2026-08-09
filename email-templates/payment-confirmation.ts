export function paymentConfirmationEmail(data: {
  name: string;
  amount: number;
  receiptNumber: string;
  packageName: string;
  transactionId: string;
  date: string;
  phoneNumber: string;
}) {
  const subject = `Payment Confirmed - ${data.packageName} | KenyaDesires`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Confirmation</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f4f4f4; font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4; padding:20px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
              <tr>
                <td style="background-color:#fe0032; padding:30px; text-align:center;">
                  <h1 style="color:#ffffff; margin:0; font-size:28px; font-weight:bold;">KenyaDesires</h1>
                  <p style="color:#ffffff; margin:8px 0 0; opacity:0.9; font-size:14px;">Payment Confirmation</p>
                </td>
              </tr>
              <tr>
                <td style="padding:30px;">
                  <p style="color:#333333; font-size:16px; margin:0 0 20px;">Hi ${data.name},</p>
                  <p style="color:#555555; font-size:14px; line-height:1.6; margin:0 0 20px;">
                    Great news! Your payment has been successfully processed. Here are your payment details:
                  </p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f9f9; border-radius:6px; margin:0 0 20px;">
                    <tr>
                      <td style="padding:15px; border-bottom:1px solid #eeeeee;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="color:#888888; font-size:13px; padding:4px 0;">Invoice ID</td>
                            <td style="color:#333333; font-size:14px; font-weight:bold; text-align:right;">${data.transactionId}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:15px; border-bottom:1px solid #eeeeee;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="color:#888888; font-size:13px; padding:4px 0;">Package</td>
                            <td style="color:#333333; font-size:14px; font-weight:bold; text-align:right;">${data.packageName}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:15px; border-bottom:1px solid #eeeeee;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="color:#888888; font-size:13px; padding:4px 0;">Amount Paid</td>
                            <td style="color:#fe0032; font-size:16px; font-weight:bold; text-align:right;">KSH ${data.amount.toLocaleString()}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:15px; border-bottom:1px solid #eeeeee;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="color:#888888; font-size:13px; padding:4px 0;">M-Pesa Receipt</td>
                            <td style="color:#333333; font-size:14px; font-weight:bold; text-align:right;">${data.receiptNumber || "N/A"}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:15px; border-bottom:1px solid #eeeeee;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="color:#888888; font-size:13px; padding:4px 0;">Phone Number</td>
                            <td style="color:#333333; font-size:14px; font-weight:bold; text-align:right;">${data.phoneNumber}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:15px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="color:#888888; font-size:13px; padding:4px 0;">Date</td>
                            <td style="color:#333333; font-size:14px; font-weight:bold; text-align:right;">${data.date}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  <p style="color:#555555; font-size:14px; line-height:1.6; margin:0 0 20px;">
                    Your account has been updated automatically. If you have any questions or concerns, please contact our support team.
                  </p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0 0;">
                    <tr>
                      <td align="center">
                        <a href="https://kenyadesires.com/extend" style="background-color:#fe0032; color:#ffffff; padding:12px 30px; text-decoration:none; border-radius:6px; font-weight:bold; font-size:14px; display:inline-block;">View Invoices</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="background-color:#f9f9f9; padding:20px; text-align:center; border-top:1px solid #eeeeee;">
                  <p style="color:#888888; font-size:12px; margin:0;">
                    KenyaDesires - Over 800+ girls for sex from all over Kenya
                  </p>
                  <p style="color:#aaaaaa; font-size:11px; margin:8px 0 0;">
                    This is an automated message. Please do not reply to this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
Payment Confirmation - KenyaDesires

Hi ${data.name},

Your payment has been successfully processed.

Invoice ID: ${data.transactionId}
Package: ${data.packageName}
Amount Paid: KSH ${data.amount.toLocaleString()}
M-Pesa Receipt: ${data.receiptNumber || "N/A"}
Phone Number: ${data.phoneNumber}
Date: ${data.date}

Your account has been updated automatically.

KenyaDesires
  `;

  return { subject, html, text };
}
