export function adminNotificationEmail(
  userName: string,
  userEmail: string,
  role: string,
  clerkUserId: string,
): { subject: string; html: string; text: string } {
  const roleLabel = role === "business" ? "Agency" : "Escort";
  return {
    subject: `New ${roleLabel} Registration: ${userName}`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f9f9f9;padding:40px 20px;">
        <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:30px;text-align:center;">
            <h1 style="color:#fff;font-size:24px;margin:0;">New ${roleLabel} Registration</h1>
          </div>
          <div style="padding:30px;">
            <div style="background:#f8f9fa;border-radius:8px;padding:20px;margin:0 0 20px;">
              <p style="margin:0 0 8px;color:#555;font-size:14px;"><strong>Name:</strong> ${userName}</p>
              <p style="margin:0 0 8px;color:#555;font-size:14px;"><strong>Email:</strong> ${userEmail}</p>
              <p style="margin:0 0 8px;color:#555;font-size:14px;"><strong>Role:</strong> ${roleLabel}</p>
              <p style="margin:0;color:#555;font-size:14px;"><strong>User ID:</strong> ${clerkUserId}</p>
            </div>
            <p style="color:#555;font-size:16px;line-height:1.7;margin:0 0 24px;">
              A new ${roleLabel.toLowerCase()} has registered on KenyaDesires. Please review their profile and verify their identity.
            </p>
            <div style="text-align:center;margin:30px 0;">
              <a href="https://kenyadesires.com/admin" style="display:inline-block;background:#1a1a2e;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">View in Admin Panel</a>
            </div>
          </div>
          <div style="background:#f5f5f5;padding:20px 30px;text-align:center;border-top:1px solid #eee;">
            <p style="color:#999;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} KenyaDesires. All rights reserved.</p>
          </div>
        </div>
      </div>
    `,
    text: `New ${roleLabel} Registration

Name: ${userName}
Email: ${userEmail}
Role: ${roleLabel}
User ID: ${clerkUserId}

A new ${roleLabel.toLowerCase()} has registered on KenyaDesires. Please review their profile and verify their identity.

Admin Panel: https://kenyadesires.com/admin

&copy; ${new Date().getFullYear()} KenyaDesires. All rights reserved.`,
  };
}