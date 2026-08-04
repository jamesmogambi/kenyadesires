"use server";

import nodemailer from "nodemailer";
import {
  welcomeEmail,
  adminNotificationEmail,
  verificationNotificationEmail,
} from "@/email-templates";

const ADMIN_EMAIL = "hello@kenyadesires.com";

function getTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error("EMAIL_USER and EMAIL_PASSWORD must be set");
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
}

export async function sendRegistrationEmails(data: {
  email: string;
  name: string;
  clerkUserId: string;
  role: string;
}): Promise<void> {
  const { email, name, clerkUserId, role } = data;
  const credits = role === "business" ? 100 : 20;

  await sendWelcomeEmail(email, name, credits, role);
  await sendAdminNotificationEmail(name, email, role, clerkUserId);
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
  credits: number,
  role: string,
): Promise<void> {
  try {
    const { subject, html, text } = welcomeEmail(name, credits, role);
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"KenyaDesires" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text,
    });
  } catch (err: any) {
    console.error("Failed to send welcome email:", err?.message || err);
  }
}

export async function sendAdminNotificationEmail(
  userName: string,
  userEmail: string,
  role: string,
  clerkUserId: string,
): Promise<void> {
  try {
    const { subject, html, text } = adminNotificationEmail(
      userName,
      userEmail,
      role,
      clerkUserId,
    );
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"KenyaDesires" <${process.env.EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject,
      html,
      text,
    });
  } catch (err: any) {
    console.error("Failed to send admin notification:", err?.message || err);
  }
}

export async function sendVerificationNotificationEmail(
  to: string,
  name: string,
  status: string,
  decision?: string | null,
): Promise<void> {
  try {
    const { subject, html, text } = verificationNotificationEmail(
      name,
      status,
      decision,
    );
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"KenyaDesires" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text,
    });
  } catch (err: any) {
    console.error("Failed to send verification email:", err?.message || err);
  }
}