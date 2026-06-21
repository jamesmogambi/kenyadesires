import {NextRequest, NextResponse} from "next/server";
import nodemailer from "nodemailer";
import {adminDb} from "@/lib/firebase-admin";
import {FieldValue} from "firebase-admin/firestore";

const supportAdmin = process.env.CONTACT_EMAIL || "support@kenyadivas.com";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {email, name, message, clerkUserId = ""} = body;

        // Check for missing fields and identify them
        const missingFields = [];
        if (!email) missingFields.push("email");
        if (!name) missingFields.push("name");
        if (!message) missingFields.push("message");

        if (missingFields.length > 0) {
            console.warn(`Contact API: Missing fields: ${missingFields.join(", ")}`, {body});
            return NextResponse.json(
                {
                    error: "Missing required fields",
                    missing: missingFields,
                    received: Object.keys(body)
                },
                {status: 400}
            );
        }

        // 1. Send email via SMTP using Nodemailer (Mailtrap)
        let transporter;
        let emailSent = false;
        let smtpError = null;

        try {
            if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
                throw new Error("SMTP configuration is incomplete. Check environment variables.");
            }

            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || "2525"),
                secure: process.env.SMTP_SECURE === "true",
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            const mailOptions = {
                from: `"KenyaDivas Contact" <no-reply@kenyadivas.com>`,
                replyTo: email,
                to: supportAdmin,
                subject: `KenyaDivas - New message from ${name}`,
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

        // 2. Save to Firestore
        const submissionData = {
            name,
            email,
            message,
            clerkUserId,
            submittedAt: FieldValue.serverTimestamp(),
            ip: req.headers.get("x-forwarded-for") ?? "unknown",
            userAgent: req.headers.get("user-agent") ?? "unknown",
            emailSent,
            emailError: smtpError,
        };

        await adminDb.collection("contactSubmissions").add(submissionData);

        if (!emailSent) {
            return NextResponse.json(
                {error: "Failed to send email, but message was saved.", details: smtpError},
                {status: 500}
            );
        }

        return NextResponse.json(
            {success: true, message: "Email sent successfully"},
            {status: 200}
        );
    } catch (err: any) {
        console.error("Contact API error:", err);
        return NextResponse.json(
            {error: "Internal server error"},
            {status: 500}
        );
    }
}
