/**
 * Minimal PDF 1.4 writer.
 *
 * The site ships no PDF dependency, and the previous "invoice" was a CSV of
 * Field/Value rows. This builds a real single-page PDF from Helvetica/Helvetica-
 * Bold (the two standard PDF base-14 fonts, so nothing has to be embedded) with
 * just enough layout primitives for a professional invoice: text with
 * alignment, filled rectangles, hairlines, and word wrapping.
 *
 * Coordinates are top-down (y grows downwards, like the screen) and converted
 * to PDF's bottom-left origin when written, so layout code reads normally.
 */

/** AFM advance widths (1/1000 em) for WinAnsi 32..126. */
const W_REGULAR = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278,
  278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584,
  584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556,
  833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278,
  278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222,
  500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500,
  500, 334, 260, 334, 584,
];

const W_BOLD = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278,
  278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584,
  584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611,
  833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333,
  278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278,
  556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556,
  500, 389, 280, 389, 584,
];

const FIRST_CHAR = 32;

/**
 * Advance widths for the Latin-1 glyphs that survive sanitising. The main
 * tables above only cover ASCII 32..126; without these a middot or non
 * breaking space would be measured with the 556 default and right-aligned
 * text would drift past its margin.
 */
const EXTRA_WIDTHS: Record<number, number> = {
  0xa0: 278, // no-break space
  0xb7: 278, // middot
  0x2013: 333, // en dash (transliterated away, kept for safety)
  0x2018: 222,
  0x2019: 222,
  0x201c: 333,
  0x201d: 333,
};

/** Non-ASCII characters that reach us from user-entered metadata. */
const TRANSLITERATE: Record<string, string> = {
  "‘": "'",
  "’": "'",
  "“": '"',
  "”": '"',
  "–": "-",
  "—": "-",
  "…": "...",
  " ": " ",
};

export type Rgb = [number, number, number];

export const COLORS = {
  ink: [17, 24, 39] as Rgb,
  body: [55, 65, 81] as Rgb,
  muted: [107, 114, 128] as Rgb,
  faint: [156, 163, 175] as Rgb,
  brand: [185, 28, 28] as Rgb,
  zebra: [250, 250, 250] as Rgb,
  band: [243, 244, 246] as Rgb,
  hairline: [229, 231, 235] as Rgb,
  paidFill: [236, 253, 245] as Rgb,
  paidInk: [4, 120, 87] as Rgb,
  pendingFill: [255, 251, 235] as Rgb,
  pendingInk: [180, 83, 9] as Rgb,
  failedFill: [254, 242, 242] as Rgb,
  failedInk: [185, 28, 28] as Rgb,
};

export interface TextOptions {
  size?: number;
  bold?: boolean;
  color?: Rgb;
  align?: "left" | "right" | "center";
  /** Width that `align: "right"` / `"center"` measures against. */
  containerWidth?: number;
  /** Extra spacing inserted between letters, in points. */
  tracking?: number;
}

export function sanitizeText(input: string): string {
  let out = "";
  for (const char of input) {
    if (TRANSLITERATE[char]) {
      out += TRANSLITERATE[char];
    } else if (char.charCodeAt(0) <= 255 && char.charCodeAt(0) >= FIRST_CHAR) {
      // WinAnsiEncoding covers Latin-1, so these survive as real glyphs (e.g.
      // the middot in "Brand · site"). Anything wider than that has no glyph.
      out += char;
    } else {
      out += "?";
    }
  }
  return out;
}

export function measureText(
  text: string,
  size = 10,
  bold = false,
  tracking = 0,
): number {
  const widths = bold ? W_BOLD : W_REGULAR;
  const clean = sanitizeText(text);
  let total = 0;
  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i);
    const index = code - FIRST_CHAR;
    const advance =
      index >= 0 && index < widths.length ? widths[index] : EXTRA_WIDTHS[code];
    total += (advance ?? 556) + tracking;
  }
  return (total * size) / 1000;
}

/** Greedy word wrap, capped at `maxLines` with an ellipsis on overflow. */
export function wrapText(
  text: string,
  maxWidth: number,
  size = 10,
  bold = false,
  maxLines = 2,
): string[] {
  const clean = sanitizeText(text).replace(/\s+/g, " ").trim();
  if (!clean) return [""];
  if (measureText(clean, size, bold) <= maxWidth) return [clean];

  const lines: string[] = [];
  let current = "";
  for (const word of clean.split(" ")) {
    const candidate = current ? `${current} ${word}` : word;
    // A single word wider than the column is kept whole rather than dropped.
    if (!current || measureText(candidate, size, bold) <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  if (lines.length <= maxLines) return lines;

  // Keep the leading lines untouched and fold everything that did not fit into
  // the final one, trimming characters until the ellipsis fits.
  const kept = lines.slice(0, Math.max(0, maxLines - 1));
  let last = lines.slice(Math.max(0, maxLines - 1)).join(" ");
  while (last && measureText(`${last}...`, size, bold) > maxWidth) {
    last = last.slice(0, -1).trimEnd();
  }
  kept.push(`${last}...`);
  return kept;
}

const escapePdf = (text: string): string =>
  sanitizeText(text).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

export class PdfDocument {
  private readonly ops: string[] = [];

  constructor(
    private readonly width = 595.28,
    private readonly height = 841.89,
    private readonly title = "Document",
  ) {}

  private get fontRef(): string {
    return "/F1";
  }

  text(value: string, x: number, yTop: number, options: TextOptions = {}): void {
    const {
      size = 10,
      bold = false,
      color = COLORS.ink,
      align = "left",
      containerWidth = 0,
      tracking = 0,
    } = options;

    const clean = sanitizeText(value);
    if (!clean) return;

    const measured = measureText(clean, size, bold, tracking);
    let drawX = x;
    if (align === "right") drawX = x + containerWidth - measured;
    else if (align === "center") drawX = x + (containerWidth - measured) / 2;

    const y = this.height - yTop;
    const [r, g, b] = color;
    const font = bold ? "/F2" : this.fontRef;
    const trackingOp = tracking ? `${tracking} Tc ` : "";

    this.ops.push(
      `BT ${trackingOp}${rgbFill(r, g, b)} ${font} ${size} Tf 1 0 0 1 ${round(drawX)} ${round(y)} Tm (${escapePdf(clean)}) Tj ET`,
    );
  }

  rect(x: number, yTop: number, width: number, height: number, color: Rgb): void {
    const y = this.height - yTop - height;
    this.ops.push(
      `${rgbFill(color[0], color[1], color[2])} ${round(x)} ${round(y)} ${round(width)} ${round(height)} re f`,
    );
  }

  line(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: Rgb = COLORS.hairline,
    thickness = 0.75,
  ): void {
    this.ops.push(
      `${rgbStroke(color[0], color[1], color[2])} ${round(thickness)} w ${round(x1)} ${round(this.height - y1)} m ${round(x2)} ${round(this.height - y2)} l S`,
    );
  }

  /** Serialises to a PDF file as raw bytes (latin1 keeps one byte per char). */
  build(): Uint8Array {
    const content = this.ops.join("\n");
    const objects = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${round(this.width)} ${round(this.height)}] ` +
        `/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    ];

    let pdf = "%PDF-1.4\n";
    const offsets: number[] = [];
    objects.forEach((body, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
    });

    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";
    for (const offset of offsets) {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    }
    pdf +=
      `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info << /Title (${escapePdf(this.title)}) >> >>\n` +
      `startxref\n${xrefOffset}\n%%EOF`;

    const bytes = new Uint8Array(pdf.length);
    for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
    return bytes;
  }
}

const round = (value: number): number => Math.round(value * 100) / 100;

const rgbFill = (r: number, g: number, b: number): string =>
  `${round(r / 255)} ${round(g / 255)} ${round(b / 255)} rg`;

const rgbStroke = (r: number, g: number, b: number): string =>
  `${round(r / 255)} ${round(g / 255)} ${round(b / 255)} RG`;
