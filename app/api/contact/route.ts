import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const supportAdmin = "support@kenyadesires.xyz";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, message, clerkUserId = "" } = body;

    const missingFields = [];
    if (!email) missingFields.push("email");
    if (!name) missingFields.push("name");
    if (!message) missingFields.push("message");

    if (missingFields.length > 0) {
      console.warn(`Contact API: Missing fields: ${missingFields.join(", ")}`, {
        body,
      });
      return NextResponse.json(
        {
          error: "Missing required fields",
          missing: missingFields,
          received: Object.keys(body),
        },
        { status: 400 },
      );
    }

    let emailSent = false;
    let smtpError = null;

    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        throw new Error(
          "Email configuration is incomplete. Check EMAIL_USER and EMAIL_PASSWORD environment variables.",
        );
      }

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      const mailOptions = {
        from: `"KenyaDesires Contact" <${process.env.EMAIL_USER}>`,
        replyTo: email,
        to: supportAdmin,
        subject: `KenyaDesires - New message from ${name}`,
        text: `New Contact Form Submission\n\nName: ${name}\nEmail: ${email}\nMessage: ${message}\n\nUser ID: ${clerkUserId || "Anonymous"}`,
        html: `
                    <h3>New Contact Form Submission</h3>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Message:</strong></p>
                    <p>${message.replace(/\n/g, "<br>")}</p>
                    <hr>
                    <p><small>User ID: ${clerkUserId || "Anonymous"}</small></p>
                `,
      };

      await transporter.sendMail(mailOptions);
      emailSent = true;
    } catch (err: any) {
      console.error("SMTP error:", err);
      smtpError = err.message;
    }

    if (!emailSent) {
      return NextResponse.json(
        {
          error: "Failed to send email",
          details: smtpError,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, message: "Email sent successfully" },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("Contact API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
