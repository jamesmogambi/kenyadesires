export function verificationNotificationEmail(
  name: string,
  status: string,
  decision?: string | null,
  credits = 0,
): { subject: string; html: string; text: string } {
  const statusLabel = status === "Approved" ? "Verified" : status;
  const statusColor = status === "Approved" ? "#2e7d32" : status === "Declined" ? "#c62828" : "#e65100";
  const statusIcon = status === "Approved" ? "&#x2705;" : status === "Declined" ? "&#x274C;" : "&#x1F504;";

  return {
    subject: `Your KenyaDesires Verification is ${statusLabel}`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f9f9f9;padding:40px 20px;">
        <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:40px 30px;text-align:center;">
            <h1 style="color:#fff;font-size:28px;margin:0 0 8px;">KenyaDesires</h1>
            <p style="color:#e0e0e0;font-size:14px;margin:0;">Verification Update</p>
          </div>
          <div style="padding:30px;">
            <h2 style="color:#1a1a2e;font-size:22px;margin:0 0 16px;">${statusIcon} Verification ${statusLabel}</h2>
            <p style="color:#555;font-size:16px;line-height:1.7;margin:0 0 24px;">
              Hello ${name}, your identity verification has been <strong style="color:${statusColor}">${statusLabel}</strong>.
            </p>
            ${decision ? `
            <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin:0 0 24px;">
              <p style="color:#888;font-size:13px;margin:0 0 8px;">Decision Details</p>
              <p style="color:#555;font-size:14px;margin:0;white-space:pre-wrap;">${decision}</p>
            </div>
            ` : ""}
            ${status === "Approved" && credits > 0 ? `
            <div style="background:linear-gradient(135deg,#e8f5e9 0%,#c8e6c9 100%);border:1px solid #a5d6a7;border-radius:10px;padding:20px;margin:0 0 24px;text-align:center;">
              <p style="color:#2e7d32;font-size:14px;margin:0 0 8px;font-weight:600;">&#x1F4B0; ${credits} Bonus Credits Added</p>
              <p style="color:#555;font-size:13px;margin:0;">Your account has been credited with ${credits} credits for completing verification.</p>
            </div>
            ` : ""}
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
    text: `Your KenyaDesires Verification is ${statusLabel}

Hello ${name},

Your identity verification has been ${statusLabel}.
${decision ? `\nDecision Details:\n${decision}` : ""}
${status === "Approved" && credits > 0 ? `\n${credits} bonus credits have been added to your account for completing verification.` : ""}

Go to https://kenyadesires.com to access your dashboard.

If you have any questions, contact our support team.

&copy; ${new Date().getFullYear()} KenyaDesires. All rights reserved.`,
  };
}