"use server";

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { WhatsAppCampaign, WhatsAppCampaignContact } from "@/types/campaign.types";

export async function createCampaign(data: {
  name: string;
  messageTemplate: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    if (!data.name || !data.messageTemplate) {
      return { success: false, error: "Name and message template are required" };
    }

    const docRef = await adminDb.collection("whatsappCampaigns").add({
      name: data.name,
      messageTemplate: data.messageTemplate,
      status: "draft",
      totalContacts: 0,
      sentCount: 0,
      failedCount: 0,
      skippedCount: 0,
      lastProcessedIndex: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating campaign:", error);
    return { success: false, error: "Failed to create campaign" };
  }
}

export async function getCampaignById(
  campaignId: string,
): Promise<WhatsAppCampaign | null> {
  try {
    const doc = await adminDb.collection("whatsappCampaigns").doc(campaignId).get();
    if (!doc.exists) return null;

    const data = doc.data() as any;
    return {
      id: doc.id,
      name: data.name,
      messageTemplate: data.messageTemplate,
      status: data.status,
      totalContacts: data.totalContacts || 0,
      sentCount: data.sentCount || 0,
      failedCount: data.failedCount || 0,
      skippedCount: data.skippedCount || 0,
      lastProcessedIndex: data.lastProcessedIndex || 0,
      startedAt: data.startedAt?.toDate?.()?.toISOString() || data.startedAt,
      completedAt: data.completedAt?.toDate?.()?.toISOString() || data.completedAt,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    };
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return null;
  }
}

export async function updateCampaignStatus(
  campaignId: string,
  status: "draft" | "active" | "paused" | "completed",
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = {
      status,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (status === "active") {
      updateData.startedAt = FieldValue.serverTimestamp();
    }
    if (status === "completed") {
      updateData.completedAt = FieldValue.serverTimestamp();
    }

    await adminDb.collection("whatsappCampaigns").doc(campaignId).update(updateData);
    return { success: true };
  } catch (error) {
    console.error("Error updating campaign status:", error);
    return { success: false, error: "Failed to update campaign status" };
  }
}

export async function updateCampaignProgress(
  campaignId: string,
  progress: {
    totalContacts?: number;
    sentCount?: number;
    failedCount?: number;
    skippedCount?: number;
    lastProcessedIndex?: number;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = {
      ...progress,
      updatedAt: FieldValue.serverTimestamp(),
    };

    await adminDb.collection("whatsappCampaigns").doc(campaignId).update(updateData);
    return { success: true };
  } catch (error) {
    console.error("Error updating campaign progress:", error);
    return { success: false, error: "Failed to update campaign progress" };
  }
}

export async function addCampaignContact(
  data: {
    campaignId: string;
    escortId: string;
    phone: string;
    status: "pending" | "sent" | "failed" | "skipped";
    msgId?: number;
    error?: string;
  },
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const docRef = await adminDb.collection("whatsappCampaignContacts").add({
      campaignId: data.campaignId,
      escortId: data.escortId,
      phone: data.phone,
      status: data.status,
      msgId: data.msgId || null,
      error: data.error || null,
      sentAt: data.status === "sent" ? FieldValue.serverTimestamp() : null,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding campaign contact:", error);
    return { success: false, error: "Failed to add campaign contact" };
  }
}

export async function isPhoneContactedInCampaign(
  campaignId: string,
  phone: string,
): Promise<boolean> {
  try {
    const snapshot = await adminDb
      .collection("whatsappCampaignContacts")
      .where("campaignId", "==", campaignId)
      .where("phone", "==", phone)
      .get();

    return snapshot.docs.some((doc) => {
      const data = doc.data();
      return data.status === "sent" || data.status === "failed";
    });
  } catch (error) {
    console.error("Error checking phone contact status:", error);
    return false;
  }
}

export async function getCampaignContacts(
  campaignId: string,
  status?: "pending" | "sent" | "failed" | "skipped",
): Promise<WhatsAppCampaignContact[]> {
  try {
    let q = adminDb
      .collection("whatsappCampaignContacts")
      .where("campaignId", "==", campaignId)
      .orderBy("createdAt", "asc");

    if (status) {
      q = q.where("status", "==", status);
    }

    const snapshot = await q.get();
    return snapshot.docs.map((doc) => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        campaignId: data.campaignId,
        escortId: data.escortId,
        phone: data.phone,
        status: data.status,
        msgId: data.msgId,
        error: data.error,
        sentAt: data.sentAt?.toDate?.()?.toISOString() || data.sentAt,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      };
    });
  } catch (error) {
    console.error("Error fetching campaign contacts:", error);
    return [];
  }
}

export async function getAllCampaigns(): Promise<WhatsAppCampaign[]> {
  try {
    const snapshot = await adminDb
      .collection("whatsappCampaigns")
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        name: data.name,
        messageTemplate: data.messageTemplate,
        status: data.status,
        totalContacts: data.totalContacts || 0,
        sentCount: data.sentCount || 0,
        failedCount: data.failedCount || 0,
        skippedCount: data.skippedCount || 0,
        lastProcessedIndex: data.lastProcessedIndex || 0,
        startedAt: data.startedAt?.toDate?.()?.toISOString() || data.startedAt,
        completedAt: data.completedAt?.toDate?.()?.toISOString() || data.completedAt,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      };
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return [];
  }
}
