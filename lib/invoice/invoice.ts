/**
 * Invoice document: turns a `transactions` row into a branded, professional
 * A4 PDF invoice. Replaces the flat `Field,Value` CSV that both the invoices
 * page and the payment-status page used to download.
 *
 * No PDF dependency: the layout is drawn with lib/invoice/pdf.ts on top of the
 * standard PDF base-14 fonts, so the bytes are generated in the browser and
 * saved straight from a Blob.
 */

import {
  COLORS,
  PdfDocument,
  Rgb,
  measureText,
  wrapText,
} from "./pdf";

const PAGE_WIDTH = 595.28;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const RIGHT = PAGE_WIDTH - MARGIN;

export interface InvoiceBrand {
  name: string;
  website: string;
  email: string;
  phone?: string | null;
}

export const DEFAULT_BRAND: InvoiceBrand = {
  name: "KenyaDesires",
  website: "kenyadesires.xyz",
  email: "support@kenyadesires.xyz",
};

export interface InvoiceTransaction {
  id: string;
  checkoutRequestId?: string | null;
  amount?: number | null;
  currency?: string | null;
  status: string;
  paymentMethod?: string | null;
  phoneNumber?: string | null;
  type?: string | null;
  packageName?: string | null;
  accountReference?: string | null;
  transactionDesc?: string | null;
  receiptNumber?: string | null;
  transactionDate?: number | string | null;
  resultCode?: number | null;
  resultDesc?: string | null;
  credits?: number | null;
  createdAt?: string | Date | null;
}

export interface InvoiceCustomer {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

/** INV-202609-1A2B3C — stable, sortable, and traceable back to the row id. */
export function invoiceNumberFor(tx: InvoiceTransaction, issuedAt: Date): string {
  const stamp = `${issuedAt.getFullYear()}${String(issuedAt.getMonth() + 1).padStart(2, "0")}`;
  const suffix = tx.id.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase() || "000000";
  return `INV-${stamp}-${suffix}`;
}

export function invoiceFileName(tx: InvoiceTransaction, issuedAt: Date): string {
  return `${invoiceNumberFor(tx, issuedAt)}.pdf`;
}

function currencyLabel(currency?: string | null): string {
  switch ((currency || "KES").toUpperCase()) {
    case "KES":
      return "KSh";
    case "USD":
      return "USD";
    default:
      return (currency || "KES").toUpperCase();
  }
}

function formatMoney(value: number, currency?: string | null): string {
  const amount = Number(value) || 0;
  const formatted = new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${currencyLabel(currency)} ${formatted}`;
}

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_STYLE: Record<string, { label: string; fill: Rgb; ink: Rgb }> = {
  completed: { label: "PAID", fill: COLORS.paidFill, ink: COLORS.paidInk },
  pending: { label: "PENDING", fill: COLORS.pendingFill, ink: COLORS.pendingInk },
  failed: { label: "FAILED", fill: COLORS.failedFill, ink: COLORS.failedInk },
};

function statusStyle(status: string) {
  return (
    STATUS_STYLE[(status || "").toLowerCase()] || {
      label: (status || "UNKNOWN").toUpperCase(),
      fill: COLORS.band,
      ink: COLORS.body,
    }
  );
}

/** Human label for what was actually bought. */
function describe(tx: InvoiceTransaction): string {
  const base =
    tx.packageName ||
    tx.transactionDesc ||
    (tx.type === "boost" ? "Listing boost" : null) ||
    (tx.type === "credits" ? "Advertising credits" : null) ||
    (tx.type ? `${tx.type} payment` : null) ||
    "Advertising services";

  if (tx.credits && Number(tx.credits) > 0) {
    return `${base} (${tx.credits} credits)`;
  }
  return base;
}

export function buildInvoicePdf(
  tx: InvoiceTransaction,
  customer: InvoiceCustomer = {},
  brand: InvoiceBrand = DEFAULT_BRAND,
): Uint8Array {
  const issuedAt = tx.createdAt ? new Date(tx.createdAt) : new Date();
  const safeIssuedAt = Number.isNaN(issuedAt.getTime()) ? new Date() : issuedAt;
  const invoiceNumber = invoiceNumberFor(tx, safeIssuedAt);
  const amount = Number(tx.amount) || 0;
  const style = statusStyle(tx.status);

  const doc = new PdfDocument(PAGE_WIDTH, 841.89, `Invoice ${invoiceNumber}`);

  // ---- Masthead ------------------------------------------------------------
  doc.text(brand.name, MARGIN, 52, { size: 20, bold: true, color: COLORS.ink });
  doc.text("INVOICE", MARGIN, 50, {
    size: 24,
    bold: true,
    color: COLORS.brand,
    align: "right",
    containerWidth: CONTENT_WIDTH,
  });
  doc.text(invoiceNumber, MARGIN, 74, {
    size: 9.5,
    color: COLORS.muted,
    align: "right",
    containerWidth: CONTENT_WIDTH,
  });

  // Status pill, right-aligned under the invoice number.
  const pillW = Math.max(58, measureText(style.label, 8.5, true, 0.8) + 22);
  const pillH = 17;
  const pillX = RIGHT - pillW;
  const pillY = 86;
  doc.rect(pillX, pillY, pillW, pillH, style.fill);
  doc.text(style.label, pillX, pillY + 5.5, {
    size: 8.5,
    bold: true,
    color: style.ink,
    align: "center",
    containerWidth: pillW,
    tracking: 0.8,
  });

  doc.line(MARGIN, 116, RIGHT, 116, COLORS.brand, 2);

  // ---- Issuer / invoice details -------------------------------------------
  let y = 136;
  doc.text("ISSUED BY", MARGIN, y, { size: 7.5, bold: true, color: COLORS.faint, tracking: 1 });
  doc.text(brand.name, MARGIN, y + 13, { size: 12, bold: true, color: COLORS.ink });
  doc.text(brand.website, MARGIN, y + 29, { size: 9.5, color: COLORS.body });
  doc.text(brand.email, MARGIN, y + 42, { size: 9.5, color: COLORS.body });
  if (brand.phone) {
    doc.text(brand.phone, MARGIN, y + 55, { size: 9.5, color: COLORS.body });
  }

  const detailX = MARGIN + 268;
  const detailWidth = RIGHT - detailX;
  const detailRows: Array<[string, string]> = [
    ["Invoice No", invoiceNumber],
    ["Issue date", formatDate(safeIssuedAt)],
    ["Payment due", style.label === "PAID" ? "Paid in full" : "Due immediately"],
  ];
  let detailY = 136;
  for (const [label, value] of detailRows) {
    doc.text(label, detailX, detailY, { size: 9.5, color: COLORS.muted });
    doc.text(value, detailX, detailY, {
      size: 9.5,
      bold: true,
      color: COLORS.ink,
      align: "right",
      containerWidth: detailWidth,
    });
    detailY += 15;
  }

  // ---- Bill to -------------------------------------------------------------
  y = Math.max(detailY + 22, 214);
  doc.line(MARGIN, y - 14, RIGHT, y - 14);
  doc.text("BILL TO", MARGIN, y, { size: 7.5, bold: true, color: COLORS.faint, tracking: 1 });

  const customerName = (customer.name || "").trim() || "KenyaDesires member";
  const customerEmail = (customer.email || "").trim();
  const customerPhone = (customer.phone || tx.phoneNumber || "").trim();

  doc.text(customerName, MARGIN, y + 13, { size: 11.5, bold: true, color: COLORS.ink });
  if (customerEmail) {
    doc.text(customerEmail, MARGIN, y + 28, { size: 9.5, color: COLORS.muted });
  }
  if (customerPhone) {
    doc.text(
      customerPhone,
      MARGIN,
      customerEmail ? y + 41 : y + 28,
      { size: 9.5, color: COLORS.muted },
    );
  }

  // ---- Line items ----------------------------------------------------------
  const tableTop = y + 66;
  const descX = MARGIN + 12;
  const descWidth = 250;
  const qtyRight = MARGIN + 302;
  const unitRight = MARGIN + 382;
  const amountRight = RIGHT;

  doc.rect(MARGIN, tableTop, CONTENT_WIDTH, 26, COLORS.band);
  doc.text("DESCRIPTION", descX, tableTop + 9, {
    size: 8.5,
    bold: true,
    color: COLORS.body,
    tracking: 0.6,
  });
  doc.text("QTY", descX, tableTop + 9, {
    size: 8.5,
    bold: true,
    color: COLORS.body,
    align: "right",
    containerWidth: qtyRight - descX,
  });
  doc.text("UNIT PRICE", descX, tableTop + 9, {
    size: 8.5,
    bold: true,
    color: COLORS.body,
    align: "right",
    containerWidth: unitRight - descX,
  });
  doc.text("AMOUNT", descX, tableTop + 9, {
    size: 8.5,
    bold: true,
    color: COLORS.body,
    align: "right",
    containerWidth: amountRight - descX,
  });

  const itemTop = tableTop + 26;
  const descriptionLines = wrapText(describe(tx), descWidth, 9.5, false, 2);
  const rowHeight = descriptionLines.length > 1 ? 40 : 28;
  // First baseline is shared by the description and the numeric columns so the
  // row reads as one line; a second description line hangs 13pt below it.
  const firstBaseline = itemTop + 17;

  doc.rect(MARGIN, itemTop, CONTENT_WIDTH, rowHeight, COLORS.zebra);
  descriptionLines.forEach((line, index) => {
    doc.text(line, descX, firstBaseline + index * 13, {
      size: 9.5,
      color: COLORS.ink,
    });
  });
  doc.text("1", descX, firstBaseline, {
    size: 9.5,
    color: COLORS.body,
    align: "right",
    containerWidth: qtyRight - descX,
  });
  doc.text(formatMoney(amount, tx.currency), descX, firstBaseline, {
    size: 9.5,
    color: COLORS.body,
    align: "right",
    containerWidth: unitRight - descX,
  });
  doc.text(formatMoney(amount, tx.currency), descX, firstBaseline, {
    size: 9.5,
    bold: true,
    color: COLORS.ink,
    align: "right",
    containerWidth: amountRight - descX,
  });
  doc.line(MARGIN, itemTop + rowHeight, RIGHT, itemTop + rowHeight);

  // ---- Totals --------------------------------------------------------------
  let totalsY = itemTop + rowHeight + 18;
  const labelX = RIGHT - 177;
  const labelWidth = 100;
  const valueX = RIGHT - 77;
  const valueWidth = 77;

  doc.text("Subtotal", labelX, totalsY, {
    size: 9.5,
    color: COLORS.muted,
    align: "right",
    containerWidth: labelWidth,
  });
  doc.text(formatMoney(amount, tx.currency), valueX, totalsY, {
    size: 9.5,
    color: COLORS.ink,
    align: "right",
    containerWidth: valueWidth,
  });

  totalsY += 20;
  // Band is tall enough to contain the 12.5pt total's ascender above the shared
  // baseline, so label and amount sit on one line inside the highlight.
  doc.rect(RIGHT - 197, totalsY - 11, 197, 30, COLORS.band);
  doc.text("Total paid", labelX, totalsY, {
    size: 11,
    bold: true,
    color: COLORS.ink,
    align: "right",
    containerWidth: labelWidth,
  });
  doc.text(formatMoney(amount, tx.currency), valueX, totalsY, {
    size: 12.5,
    bold: true,
    color: COLORS.brand,
    align: "right",
    containerWidth: valueWidth,
  });

  // ---- Payment details -----------------------------------------------------
  let paymentY = totalsY + 42;
  doc.text("PAYMENT DETAILS", MARGIN, paymentY, {
    size: 7.5,
    bold: true,
    color: COLORS.faint,
    tracking: 1,
  });

  const paymentRows: Array<[string, string]> = [
    ["Method", tx.paymentMethod || "M-Pesa / Card (Pesapal)"],
    ["Phone", tx.phoneNumber || customerPhone || "—"],
    ["Receipt No", tx.receiptNumber || "—"],
    ["Transaction ID", tx.accountReference || tx.checkoutRequestId || "—"],
    ["Paid at", formatDateTime(tx.createdAt)],
  ];
  if (tx.resultDesc) {
    paymentRows.push(["Result", tx.resultDesc]);
  }

  const labelColX = MARGIN;
  const valueColX = MARGIN + 128;
  paymentY += 16;
  for (const [label, value] of paymentRows) {
    doc.text(label, labelColX, paymentY, { size: 9, color: COLORS.muted });
    const lines = wrapText(value, RIGHT - valueColX, 9.5, false, 2);
    lines.forEach((line, index) => {
      doc.text(line, valueColX, paymentY + index * 12, { size: 9.5, color: COLORS.body });
    });
    paymentY += 12 * lines.length + 4;
  }

  // ---- Footer --------------------------------------------------------------
  doc.line(MARGIN, 770, RIGHT, 770);
  doc.text("Thank you for your business.", MARGIN, 788, {
    size: 10,
    bold: true,
    color: COLORS.ink,
  });
  doc.text(
    `${brand.name} · ${brand.website} · ${brand.email}`,
    MARGIN,
    788,
    {
      size: 8,
      color: COLORS.faint,
      align: "right",
      containerWidth: CONTENT_WIDTH,
    },
  );
  doc.text(
    "Payment received. This document serves as your receipt. Amounts are in Kenya Shillings (KSh).",
    MARGIN,
    802,
    { size: 8, color: COLORS.faint },
  );
  doc.text(
    `Generated ${formatDateTime(new Date())}`,
    MARGIN,
    814,
    { size: 8, color: COLORS.faint, align: "right", containerWidth: CONTENT_WIDTH },
  );

  return doc.build();
}

/** Saves the invoice as a PDF. Call from a click handler (browser only). */
export function downloadInvoice(
  tx: InvoiceTransaction,
  customer: InvoiceCustomer = {},
  brand: InvoiceBrand = DEFAULT_BRAND,
): void {
  const issuedAt = tx.createdAt ? new Date(tx.createdAt) : new Date();
  const safeIssuedAt = Number.isNaN(issuedAt.getTime()) ? new Date() : issuedAt;
  const bytes = buildInvoicePdf(tx, customer, brand);

  // `bytes` is a plain ArrayBuffer view; copy into a fresh buffer so the Blob
  // never aliases a larger underlying ArrayBuffer.
  const buffer = new Uint8Array(bytes.byteLength);
  buffer.set(bytes);
  const blob = new Blob([buffer], { type: "application/pdf" });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = invoiceFileName(tx, safeIssuedAt);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
