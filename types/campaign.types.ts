export interface WhatsAppCampaign {
  id: string;
  name: string;
  messageTemplate: string;
  status: "draft" | "active" | "paused" | "completed";
  totalContacts: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  lastProcessedIndex: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppCampaignContact {
  id: string;
  campaignId: string;
  escortId: string;
  phone: string;
  status: "pending" | "sent" | "failed" | "skipped";
  msgId?: number;
  error?: string;
  sentAt?: string;
  createdAt: string;
}
