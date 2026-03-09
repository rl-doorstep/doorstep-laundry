/**
 * Generate a PDF receipt for a paid order.
 * Used for download and as email attachment on payment_received.
 */

import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import type { CompanyInfo } from "./settings";

export type ReceiptOrder = {
  orderNumber: string;
  totalCents: number;
  createdAt: Date;
  pickupDate: Date;
  deliveryDate: Date;
  pickupTimeSlot: string | null;
  deliveryTimeSlot: string | null;
  customer: { name: string | null; email: string; phone?: string | null };
  pickupAddress: { street: string; city: string; state: string; zip: string };
  deliveryAddress: { street: string; city: string; state: string; zip: string };
  orderLoads: Array<{ loadNumber: number; weightLbs: number | null }>;
};

export type ReceiptOptions = {
  /** Base price per pound in cents (e.g. 150 = $1.50). */
  pricePerPoundCents: number;
  grtPercent: number;
  company: CompanyInfo;
};

const MARGIN = 50;
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const FONT_SIZE = 10;
const FONT_SIZE_SMALL = 9;
const FONT_SIZE_TITLE = 14;
const LINE_HEIGHT = 14;
const TABLE_HEADER_HEIGHT = 20;
const ROW_HEIGHT = 16;
const LABEL_GRAY = rgb(0.45, 0.45, 0.45);
const BORDER_GRAY = rgb(0.9, 0.9, 0.9);
const BLACK = rgb(0.1, 0.1, 0.1);
const PAID_STAMP_SIZE = 72;
const LOGO_MAX_HEIGHT = 80;
const LOGO_MAX_WIDTH = 240;

function formatAddress(addr: { street: string; city: string; state: string; zip: string }): string {
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}`;
}

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

function formatDollars(cents: number): string {
  return (Math.round(cents) / 100).toFixed(2);
}

async function fetchLogoImage(
  doc: PDFDocument,
  logoUrl: string
): Promise<{
  width: number;
  height: number;
  // Page type is permissive so we can pass PDFPage (its drawImage takes PDFImage, not unknown)
  draw: (page: { drawImage: (img: import("pdf-lib").PDFImage, opts: { x: number; y: number; width: number; height: number }) => void }, x: number, y: number) => void;
} | null> {
  const base =
    process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.startsWith("http")
      ? process.env.NEXTAUTH_URL
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";
  const url = logoUrl.startsWith("http") ? logoUrl : `${base}${logoUrl}`;
  const isSvg = /\.svg$/i.test(logoUrl) || url.toLowerCase().includes(".svg");
  let bytes: ArrayBuffer;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    bytes = await res.arrayBuffer();
  } catch {
    return null;
  }
  let u8 = new Uint8Array(bytes);
  if (isSvg) {
    try {
      const sharp = (await import("sharp")).default;
      const pngBuffer = await sharp(Buffer.from(u8)).png().toBuffer();
      u8 = new Uint8Array(pngBuffer);
    } catch (e) {
      console.error("[receipt-pdf] SVG to PNG conversion failed:", e);
      return null;
    }
  }
  try {
    const image = await doc.embedPng(u8);
    const dims = image.scale(1);
    const scale = Math.min(LOGO_MAX_WIDTH / dims.width, LOGO_MAX_HEIGHT / dims.height, 1);
    const w = dims.width * scale;
    const h = dims.height * scale;
    return {
      width: w,
      height: h,
      draw(page, x, y) {
        page.drawImage(image, { x, y: y - h, width: w, height: h });
      },
    };
  } catch {
    try {
      const image = await doc.embedJpg(u8);
      const dims = image.scale(1);
      const scale = Math.min(LOGO_MAX_WIDTH / dims.width, LOGO_MAX_HEIGHT / dims.height, 1);
      const w = dims.width * scale;
      const h = dims.height * scale;
      return {
        width: w,
        height: h,
        draw(page, x, y) {
          page.drawImage(image, { x, y: y - h, width: w, height: h });
        },
      };
    } catch {
      return null;
    }
  }
}

export async function generateReceiptPdf(
  order: ReceiptOrder,
  options: ReceiptOptions
): Promise<Buffer> {
  const { pricePerPoundCents, grtPercent, company } = options;
  const totalLbs = order.orderLoads.reduce(
    (sum, l) => sum + (Number(l.weightLbs) || 0),
    0
  );
  // Compute from base price: subtotal = lbs × base, tax = subtotal × GRT%, total = subtotal + tax
  const subtotalCents = Math.round(totalLbs * pricePerPoundCents);
  const taxCents = Math.round(subtotalCents * (grtPercent / 100));
  const totalCents = subtotalCents + taxCents;
  const unitPricePerLbDollars = pricePerPoundCents / 100;
  const description = "Wash and fold delivery service";

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const { width, height } = page.getSize();
  let y = height - MARGIN;

  // ----- Title: "SALES RECEIPT" centered -----
  const titleWidth = fontBold.widthOfTextAtSize("SALES RECEIPT", FONT_SIZE_TITLE);
  page.drawText("SALES RECEIPT", {
    x: (width - titleWidth) / 2,
    y,
    size: FONT_SIZE_TITLE,
    font: fontBold,
    color: BLACK,
  });
  y -= LINE_HEIGHT * 1.5;

  // ----- Top left: Logo or company name, then address, phone, email -----
  const leftCol = MARGIN;
  if (company.logoUrl) {
    const logo = await fetchLogoImage(doc, company.logoUrl);
    if (logo) {
      logo.draw(page, leftCol, y);
      y -= logo.height + LINE_HEIGHT;
    } else {
      page.drawText(company.name, { x: leftCol, y, size: FONT_SIZE, font: fontBold, color: BLACK });
      y -= LINE_HEIGHT;
    }
  } else if (company.name) {
    page.drawText(company.name, { x: leftCol, y, size: FONT_SIZE, font: fontBold, color: BLACK });
    y -= LINE_HEIGHT;
  }
  if (company.address) {
    const addressLines = company.address.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    for (const line of addressLines) {
      page.drawText(line, { x: leftCol, y, size: FONT_SIZE_SMALL, font: font, color: BLACK });
      y -= LINE_HEIGHT;
    }
  }
  if (company.phone) {
    page.drawText(company.phone, { x: leftCol, y, size: FONT_SIZE_SMALL, font: font, color: BLACK });
    y -= LINE_HEIGHT;
  }
  if (company.email) {
    page.drawText(company.email, { x: leftCol, y, size: FONT_SIZE_SMALL, font: font, color: BLACK });
    y -= LINE_HEIGHT;
  }

  // ----- Top right: DATE:, RECEIPT NO. (no CUSTOMER; Bill to has that) -----
  const rightCol = width - MARGIN - 140;
  let yRight = height - MARGIN - LINE_HEIGHT * 4;
  page.drawText("DATE:", { x: rightCol, y: yRight, size: FONT_SIZE_SMALL, font: font, color: LABEL_GRAY });
  page.drawText(formatDate(order.createdAt), { x: rightCol + 28, y: yRight, size: FONT_SIZE_SMALL, font: font, color: BLACK });
  yRight -= LINE_HEIGHT;
  page.drawText("RECEIPT NO.:", { x: rightCol, y: yRight, size: FONT_SIZE_SMALL, font: font, color: LABEL_GRAY });
  page.drawText(order.orderNumber, { x: rightCol + 65, y: yRight, size: FONT_SIZE_SMALL, font: font, color: BLACK });

  // ----- Bill to (payor): lower section, clearly separated -----
  y = Math.min(y, yRight) - LINE_HEIGHT * 4;
  page.drawText("Bill to:", { x: MARGIN, y, size: FONT_SIZE_SMALL, font: fontBold, color: LABEL_GRAY });
  y -= LINE_HEIGHT;
  const payorLines: string[] = [];
  if (order.customer.name?.trim()) payorLines.push(order.customer.name.trim());
  if (order.customer.email?.trim()) payorLines.push(order.customer.email.trim());
  if (order.customer.phone?.trim()) payorLines.push(order.customer.phone.trim());
  payorLines.push(formatAddress(order.deliveryAddress));
  for (const line of payorLines) {
    page.drawText(line, { x: MARGIN, y, size: FONT_SIZE_SMALL, font: font, color: BLACK });
    y -= LINE_HEIGHT;
  }
  y -= LINE_HEIGHT * 0.5;

  // ----- Horizontal line -----
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: width - MARGIN, y },
    thickness: 0.5,
    color: BORDER_GRAY,
  });
  y -= LINE_HEIGHT;

  // ----- Itemized table header -----
  const colItem = MARGIN;
  const colDesc = MARGIN + 50;
  const colQty = width - MARGIN - 180;
  const colUnit = width - MARGIN - 120;
  const totalColRight = width - MARGIN - 5;

  page.drawText("ITEM NO.", { x: colItem, y, size: FONT_SIZE_SMALL, font: fontBold, color: LABEL_GRAY });
  page.drawText("DESCRIPTION", { x: colDesc, y, size: FONT_SIZE_SMALL, font: fontBold, color: LABEL_GRAY });
  page.drawText("QTY", { x: colQty, y, size: FONT_SIZE_SMALL, font: fontBold, color: LABEL_GRAY });
  page.drawText("UNIT PRICE", { x: colUnit, y, size: FONT_SIZE_SMALL, font: fontBold, color: LABEL_GRAY });
  page.drawText("TOTAL", { x: totalColRight - fontBold.widthOfTextAtSize("TOTAL", FONT_SIZE_SMALL), y, size: FONT_SIZE_SMALL, font: fontBold, color: LABEL_GRAY });
  y -= TABLE_HEADER_HEIGHT;

  for (const load of order.orderLoads) {
    const lbs = Number(load.weightLbs) || 0;
    const loadSubtotalCents = totalLbs > 0 ? Math.round((lbs / totalLbs) * subtotalCents) : 0;
    const unitPrice = totalLbs > 0 ? unitPricePerLbDollars : 0;
    const totalText = `$ ${formatDollars(loadSubtotalCents)}`;
    page.drawText(String(load.loadNumber), { x: colItem, y, size: FONT_SIZE_SMALL, font: font, color: BLACK });
    page.drawText(description, { x: colDesc, y, size: FONT_SIZE_SMALL, font: font, color: BLACK });
    page.drawText(`${lbs.toFixed(1)} lbs`, { x: colQty, y, size: FONT_SIZE_SMALL, font: font, color: BLACK });
    page.drawText(`$ ${unitPrice.toFixed(2)}`, { x: colUnit, y, size: FONT_SIZE_SMALL, font: font, color: BLACK });
    page.drawText(totalText, { x: totalColRight - font.widthOfTextAtSize(totalText, FONT_SIZE_SMALL), y, size: FONT_SIZE_SMALL, font: font, color: BLACK });
    y -= ROW_HEIGHT;
  }

  y -= LINE_HEIGHT;

  // ----- Summary: Subtotal, NMGRT, Total -----
  const sumLabelX = width - MARGIN - 130;
  const sumSubtotalText = `$ ${formatDollars(subtotalCents)}`;
  const sumTaxText = `$ ${formatDollars(taxCents)}`;
  const sumTotalText = `$ ${formatDollars(totalCents)}`;
  page.drawText("SUBTOTAL", { x: sumLabelX, y, size: FONT_SIZE_SMALL, font: font, color: LABEL_GRAY });
  page.drawText(sumSubtotalText, { x: totalColRight - font.widthOfTextAtSize(sumSubtotalText, FONT_SIZE_SMALL), y, size: FONT_SIZE_SMALL, font: font, color: BLACK });
  y -= ROW_HEIGHT;

  page.drawText(`NMGRT (${grtPercent}%)`, { x: sumLabelX, y, size: FONT_SIZE_SMALL, font: font, color: LABEL_GRAY });
  page.drawText(sumTaxText, { x: totalColRight - font.widthOfTextAtSize(sumTaxText, FONT_SIZE_SMALL), y, size: FONT_SIZE_SMALL, font: font, color: BLACK });
  y -= ROW_HEIGHT;

  page.drawText("TOTAL", { x: sumLabelX, y, size: FONT_SIZE_SMALL, font: fontBold, color: BLACK });
  page.drawText(sumTotalText, { x: totalColRight - fontBold.widthOfTextAtSize(sumTotalText, FONT_SIZE_SMALL), y, size: FONT_SIZE_SMALL, font: fontBold, color: BLACK });
  y -= ROW_HEIGHT * 1.5;

  // ----- Thank you -----
  page.drawText("Thank you for your business.", { x: MARGIN, y, size: FONT_SIZE_SMALL, font: font, color: LABEL_GRAY });

  // ----- PAID stamp at 45° (drawn last so it overlays), centered on page -----
  const paidWidth = fontBold.widthOfTextAtSize("PAID", PAID_STAMP_SIZE);
  const cos45 = Math.cos(Math.PI / 4);
  const sin45 = Math.sin(Math.PI / 4);
  const stampX = width / 2 - (cos45 * (paidWidth / 2) - sin45 * (PAID_STAMP_SIZE / 2));
  const stampY = height / 2 - (sin45 * (paidWidth / 2) + cos45 * (PAID_STAMP_SIZE / 2));
  page.drawText("PAID", {
    x: stampX,
    y: stampY,
    size: PAID_STAMP_SIZE,
    font: fontBold,
    color: rgb(0.85, 0.2, 0.2),
    opacity: 0.4,
    rotate: degrees(45),
  });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
