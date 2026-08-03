import nodemailer from "nodemailer";
import type { IAgency } from "@/types/agency.types";

const ADMIN_EMAIL = "hello@kenyadesires.com";

interface NotifyAgencyArgs {
  name: string;
  id: string;
  ownerId: string;
  verificationDocuments?: IAgency["verificationDocuments"];
}

export async function notifyAdminOfAgencyVerification(
  agency: NotifyAgencyArgs,
): Promise<void> {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn(
        "Agency verification email not sent: EMAIL_USER/EMAIL_PASSWORD missing",
      );
      return;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const docs = agency.verificationDocuments || {};
    const links = [
      docs.businessLicense && `Business Registration Certificate: ${docs.businessLicense}`,
      docs.idProof && `National ID (front): ${docs.idProof}`,
      ...(docs.otherDocuments || []).map((u) => `National ID (back): ${u}`),
    ]
      .filter(Boolean)
      .join("\n");

    await transporter.sendMail({
      from: `"KenyaDesires Agency Verification" <${process.env.EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject: `New agency verification submission - ${agency.name}`,
      html: `
        <h3>New Agency Verification Submission</h3>
        <p><strong>Agency:</strong> ${agency.name}</p>
        <p><strong>Agency ID:</strong> ${agency.id}</p>
        <p><strong>Owner ID:</strong> ${agency.ownerId}</p>
        <p><strong>Documents:</strong></p>
        <pre style="white-space:pre-wrap;">${links}</pre>
        <p>Please review the submission in the admin panel.</p>
      `,
      text: `New Agency Verification Submission

Agency: ${agency.name}
Agency ID: ${agency.id}
Owner ID: ${agency.ownerId}

Documents:
${links}`,
    });
  } catch (err: any) {
    console.error(
      "Failed to notify admin of agency verification:",
      err?.message || err,
    );
  }
}
