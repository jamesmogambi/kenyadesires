export function verificationSubmittedEmail(
  name: string,
  type: "escort" | "agency",
): { subject: string; html: string; text: string } {
  const title =
    type === "escort" ? "Identity Verification" : "Agency Verification";

  return {
    subject: `Your KenyaDesires ${title} Submission Received`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f9f9f9;padding:40px 20px;">
        <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:40px 30px;text-align:center;">
            <h1 style="color:#fff;font-size:28px;margin:0 0 8px;">KenyaDesires</h1>
            <p style="color:#e0e0e0;font-size:14px;margin:0;">Verification Submission Received</p>
          </div>
          <div style="padding:30px;">
            <h2 style="color:#1a1a2e;font-size:22px;margin:0 0 16px;">Thank You, ${name}</h2>
            <p style="color:#555;font-size:16px;line-height:1.7;margin:0 0 24px;">
              We have received your <strong>${title}</strong> documents and your submission is now <strong style="color:#e65100;">pending review</strong>.
            </p>
            <div style="background:#fff3e0;border-left:4px solid #e65100;border-radius:8px;padding:16px;margin:0 0 24px;">
              <p style="color:#e65100;font-size:14px;font-weight:600;margin:0 0 8px;">What happens next?</p>
              <p style="color:#555;font-size:14px;line-height:1.6;margin:0;">
                Our verification team will carefully review your documents. Verification typically takes <strong>a few hours</strong> during business days. You will receive a follow-up email once the review is complete.
              </p>
            </div>
            <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin:0 0 24px;">
              <p style="color:#888;font-size:13px;margin:0 0 8px;">Submission Details</p>
              <p style="color:#555;font-size:14px;margin:0;">Type: <strong>${title}</strong></p>
              <p style="color:#555;font-size:14px;margin:8px 0 0;">Status: <strong style="color:#e65100;">Pending Review</strong></p>
            </div>
            <div style="text-align:center;margin:30px 0;">
              <a href="https://kenyadesires.com" style="display:inline-block;background:#c62828;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">Go to Dashboard</a>
            </div>
            <p style="color:#999;font-size:13px;text-align:center;margin:0;">If you have any questions, contact our support team.</p>
          </div>
          <div style="background:#f5f5f5;padding:20px 30px;text-align:center;border-top:1px solid #eee;">
            <p style="color:#999;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} KenyaDesires. All rights reserved.</p>
          </div>
        </div>
      </div>
    `,
    text: `Your KenyaDesires ${title} Submission Received

Thank You, ${name},

We have received your ${title} documents and your submission is now pending review.

What happens next?
Our verification team will carefully review your documents. Verification typically takes a few hours during business days. You will receive a follow-up email once the review is complete.

Submission Details:
- Type: ${title}
- Status: Pending Review

Go to https://kenyadesires.com to access your dashboard.

If you have any questions, contact our support team.

© ${new Date().getFullYear()} KenyaDesires. All rights reserved.`,
  };
}
