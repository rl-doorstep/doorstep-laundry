/**
 * Generate a PDF receipt for a paid order.
 * Used for download and as email attachment on payment_received.
 * Layout follows a standard receipt template: company info, receipt identifiers,
 * itemized table, and subtotal / NMGRT / total.
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { computeSubtotalAndTaxCents } from "./order-total";

export type ReceiptOrder = {
  orderNumber: string;
  totalCents: number;
  createdAt: Date;
  pickupDate: Date;
  deliveryDate: Date;
  pickupTimeSlot: string | null;
  deliveryTimeSlot: string | null;
  customer: { name: string | null; email: string };
  pickupAddress: { street: string; city: string; state: string; zip: string };
  deliveryAddress: { street: string; city: string; state: string; zip: string };
  orderLoads: Array<{ loadNumber: number; weightLbs: number | null }>;
};

/** GRT percentage (e.g. 8.39). Used to show subtotal and NMGRT on receipt. */
export type ReceiptOptions = { grtPercent: number };

const COMPANY_NAME = "Doorstep Laundry";
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

function formatAddress(addr: { street: string; city: string; state: string; zip: string }): string {
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}`;
}

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

function formatDollars(cents: number): string {
  return (Math.round(cents) / 100).toFixed(2);
}

export async function generateReceiptPdf(
  order: ReceiptOrder,
  options: ReceiptOptions
): Promise<Buffer> {
  const { grtPercent } = options;
  const totalLbs = order.orderLoads.reduce(
    (sum, l) => sum + (Number(l.weightLbs) || 0),
    0
  );
  const { subtotalCents, taxCents } = computeSubtotalAndTaxCents(order.totalCents, grtPercent);
  const unitPricePerLbDollars = totalLbs > 0 ? (subtotalCents / 100) / totalLbs : 0;

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const { width } = page.getSize();
  let y = PAGE_HEIGHT - MARGIN;

  // ----- Title -----
  page.drawText("SALES RECEIPT", {
    x: MARGIN,
    y,
    size: FONT_SIZE_TITLE,
    font: fontBold,
    color: BLACK,
  });
  y -= LINE_HEIGHT * 1.5;

  // ----- Two columns: Company (left), Receipt identifiers (right) -----
  const rightCol = width - MARGIN - 140;
  page.drawText(COMPANY_NAME, { x: MARGIN, y, size: FONT_SIZE, font: fontBold, color: BLACK });
  page.drawText(formatDate(order.createdAt), { x: rightCol, y, size: FONT_SIZE_SMALL, font: font, color: LABEL_GRAY });
  y -= LINE_HEIGHT;
  page.drawText("RECEIPT NO.:", { x: rightCol, y, size: FONT_SIZE_SMALL, font: font, color: LABEL_GRAY });
  page.drawText(order.orderNumber, { x: rightCol + 65, y, size: FONT_SIZE_SMALL, font: font, color: BLACK });
  y -= LINE_HEIGHT;
  page.drawText("CUSTOMER:", { x: rightCol, y, size: FONT_SIZE_SMALL, font: font, color: LABEL_GRAY });
  page.drawText(order.customer.name ?? order.customer.email ?? "—", {
    x: rightCol + 55,
    y,
    size: FONT_SIZE_SMALL,
    font: font,
    color: BLACK,
  });
  y -= LINE_HEIGHT * 2;

  // ----- Recipient (delivery address) -----
  page.drawText("ATTN: " + (order.customer.name ?? "Customer"), { x: MARGIN, y, size: FONT_SIZE_SMALL, font: font, color: BLACK });
  y -= LINE_HEIGHT;
  page.drawText(formatAddress(order.deliveryAddress), { x: MARGIN, y, size: FONT_SIZE_SMALL, font: font, color: BLACK });
  y -= LINE_HEIGHT * 1.5;

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
  const colTotal = width - MARGIN - 55;

  page.drawText("ITEM NO.", { x: colItem, y, size: FONT_SIZE_SMALL, font: fontBold, color: LABEL_GRAY });
  page.drawText("DESCRIPTION", { x: colDesc, y, size: FONT_SIZE_SMALL, font: fontBold, color: LABEL_GRAY });
  page.drawText("QTY", { x: colQty, y, size: FONT_SIZE_SMALL, font: fontBold, color: LABEL_GRAY });
  page.drawText("UNIT PRICE", { x: colUnit, y, size: FONT_SIZE_SMALL, font: fontBold, color: LABEL_GRAY });
  page.drawText("TOTAL", { x: colTotal, y, size: FONT_SIZE_SMALL, font: fontBold, color: LABEL_GRAY });
  y -= TABLE_HEADER_HEIGHT;

  for (const load of order.orderLoads) {
    const lbs = Number(load.weightLbs) || 0;
    const loadSubtotalCents = totalLbs > 0 ? Math.round((lbs / totalLbs) * subtotalCents) : 0;
    const unitPrice = totalLbs > 0 ? unitPricePerLbDollars : 0;
    page.drawText(String(load.loadNumber), { x: colItem, y, size: FONT_SIZE_SMALL, font: font, color: BLACK });
    page.drawText("Laundry", { x: colDesc, y, size: FONT_SIZE_SMALL, font: font, color: BLACK });
    page.drawText(`${lbs.toFixed(1)} lbs`, { x: colQty, y, size: FONT_SIZE_SMALL, font: font, color: BLACK });
    page.drawText(`$ ${unitPrice.toFixed(2)}`, { x: colUnit, y, size: FONT_SIZE_SMALL, font: font, color: BLACK });
    page.drawText(`$ ${formatDollars(loadSubtotalCents)}`, { x: colTotal, y, size: FONT_SIZE_SMALL, font: font, color: BLACK });
    y -= ROW_HEIGHT;
  }

  y -= LINE_HEIGHT;

  // ----- Summary: Subtotal, NMGRT, Total -----
  const sumLabelX = width - MARGIN - 130;
  const sumValueX = colTotal;
  page.drawText("SUBTOTAL", { x: sumLabelX, y, size: FONT_SIZE_SMALL, font: font, color: LABEL_GRAY });
  page.drawText(`$ ${formatDollars(subtotalCents)}`, { x: sumValueX, y, size: FONT_SIZE_SMALL, font: font, color: BLACK });
  y -= ROW_HEIGHT;

  page.drawText(`NMGRT (${grtPercent}%)`, { x: sumLabelX, y, size: FONT_SIZE_SMALL, font: font, color: LABEL_GRAY });
  page.drawText(`$ ${formatDollars(taxCents)}`, { x: sumValueX, y, size: FONT_SIZE_SMALL, font: font, color: BLACK });
  y -= ROW_HEIGHT;

  page.drawText("TOTAL", { x: sumLabelX, y, size: FONT_SIZE_SMALL, font: fontBold, color: BLACK });
  page.drawText(`$ ${formatDollars(order.totalCents)}`, { x: sumValueX, y, size: FONT_SIZE_SMALL, font: fontBold, color: BLACK });
  y -= ROW_HEIGHT * 1.5;

  // ----- Thank you -----
  page.drawText("Thank you for your business.", { x: MARGIN, y, size: FONT_SIZE_SMALL, font: font, color: LABEL_GRAY });
  y -= LINE_HEIGHT * 2;

  // ----- Optional stub area (small "SALES RECEIPT" strip) -----
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: width - MARGIN, y },
    thickness: 0.5,
    color: BORDER_GRAY,
  });
  y -= LINE_HEIGHT;
  page.drawText("SALES RECEIPT", { x: width - MARGIN - 70, y, size: FONT_SIZE_SMALL, font: fontBold, color: LABEL_GRAY });
  page.drawText(`RECEIPT NO.: ${order.orderNumber}`, { x: MARGIN, y, size: FONT_SIZE_SMALL, font: font, color: LABEL_GRAY });
  y -= LINE_HEIGHT;
  page.drawText(`AMOUNT PAID: $ ${formatDollars(order.totalCents)}`, { x: MARGIN, y, size: FONT_SIZE_SMALL, font: font, color: BLACK });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
