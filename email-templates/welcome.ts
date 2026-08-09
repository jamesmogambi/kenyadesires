export function welcomeEmail(name: string, role: string, credits = 0): { subject: string; html: string; text: string } {
  const roleLabel = role === "business" ? "Agency" : "Escort";
  const subject = credits > 0
    ? `Welcome to KenyaDesires! Your ${roleLabel} Account is Ready`
    : `Welcome to KenyaDesires!`;

  const creditsSection = credits > 0
    ? `<div style="background:linear-gradient(135deg,#fdf2f8 0%,#fce4ec 100%);border:1px solid #f8bbd0;border-radius:10px;padding:20px;margin:0 0 24px;text-align:center;">
      <p style="color:#c2185b;font-size:14px;margin:0 0 8px;font-weight:600;">&#x1F4B0; Credits Credited</p>
      <p style="color:#1a1a2e;font-size:36px;font-weight:700;margin:0;">${credits} <span style="font-size:14px;color:#888;">credits</span></p>
      <p style="color:#888;font-size:13px;margin:4px 0 0;">KSH ${(credits * 10).toLocaleString()} equivalent has been added to your account</p>
    </div>`
    : "";

  const profileCredits = role === "business" ? 100 : 50;
  const verificationCredits = role === "business" ? 200 : 100;

  const upcomingCreditsSection = credits === 0
    ? `<div style="background:linear-gradient(135deg,#e3f2fd 0%,#bbdefb 100%);border:1px solid #90caf9;border-radius:10px;padding:20px;margin:0 0 24px;text-align:center;">
      <p style="color:#1565c0;font-size:14px;margin:0 0 8px;font-weight:600;">&#x1F4B0; Your Credits Await</p>
      <p style="color:#1a1a2e;font-size:14px;margin:0 0 8px;">
        Once you create your ${roleLabel.toLowerCase()} profile, you will receive <strong>${profileCredits} credits (KSH ${(profileCredits * 10).toLocaleString()})</strong>.
      </p>
      <p style="color:#1a1a2e;font-size:14px;margin:0;">
        After your verification is approved, you will receive an additional <strong>${verificationCredits} credits (KSH ${(verificationCredits * 10).toLocaleString()})</strong>.
      </p>
    </div>`
    : "";

  const creditsText = credits > 0
    ? `\n\n${credits} credits (KSH ${(credits * 10).toLocaleString()}) have been credited to your account.`
    : `\n\nComplete your profile to receive ${profileCredits} credits (KSH ${(profileCredits * 10).toLocaleString()}), and verify your identity to receive an additional ${verificationCredits} credits (KSH ${(verificationCredits * 10).toLocaleString()}).`;

  return {
    subject,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f9f9f9;padding:40px 20px;">
        <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:40px 30px;text-align:center;">
            <h1 style="color:#fff;font-size:28px;margin:0 0 8px;font-weight:700;">KenyaDesires</h1>
            <p style="color:#e0e0e0;font-size:14px;margin:0;">Your ${roleLabel} Account</p>
          </div>
          <div style="padding:30px;">
            <h2 style="color:#1a1a2e;font-size:22px;margin:0 0 16px;">Welcome, ${name}! &#x1F389;</h2>
            <p style="color:#555;font-size:16px;line-height:1.7;margin:0 0 24px;">
              Your account has been created successfully. You are now part of the KenyaDesires community.
            </p>
            ${creditsSection}
            ${upcomingCreditsSection}
            <p style="color:#555;font-size:16px;line-height:1.7;margin:0 0 24px;">
              You can now complete your profile, add photos, and start exploring. If you have any questions, feel free to reach out to our support team.
            </p>
            <div style="text-align:center;margin:30px 0;">
              <a href="https://kenyadesires.com" style="display:inline-block;background:#c62828;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">Go to Dashboard</a>
            </div>
            <p style="color:#999;font-size:13px;text-align:center;margin:0;">If you did not create this account, please ignore this email.</p>
          </div>
          <div style="background:#f5f5f5;padding:20px 30px;text-align:center;border-top:1px solid #eee;">
            <p style="color:#999;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} KenyaDesires. All rights reserved.</p>
          </div>
        </div>
      </div>
    `,
    text: `Welcome to KenyaDesires, ${name}!

Your ${roleLabel} account has been created successfully.${creditsText}

You can now complete your profile, add photos, and start exploring.

Go to https://kenyadesires.com to get started.

If you did not create this account, please ignore this email.

&copy; ${new Date().getFullYear()} KenyaDesires. All rights reserved.`,
  };
}