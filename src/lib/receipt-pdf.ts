/**
 * Generate a PDF receipt for a paid order.
 * Used for download and as email attachment on payment_received.
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

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

const TITLE = "Doorstep Laundry";
const MARGIN = 50;
const LINE_HEIGHT = 18;
const FONT_SIZE = 11;
const FONT_SIZE_SMALL = 10;
const FONT_SIZE_TITLE = 16;
const LETTER_WIDTH = 612;
const LETTER_HEIGHT = 792;

export async function generateReceiptPdf(order: ReceiptOrder): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([LETTER_WIDTH, LETTER_HEIGHT]);
  const { width, height } = page.getSize();
  let y = height - MARGIN;
  const black = rgb(0.1, 0.1, 0.1);
  const gray = rgb(0.4, 0.4, 0.4);

  function drawText(
    text: string,
    opts: { x?: number; size?: number; font?: typeof font; color?: ReturnType<typeof rgb> } = {}
  ) {
    const x = opts.x ?? MARGIN;
    const size = opts.size ?? FONT_SIZE;
    const f = opts.font ?? font;
    const color = opts.color ?? black;
    page.drawText(text, { x, y, size, font: f, color });
    y -= LINE_HEIGHT;
  }

  function drawLine() {
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: width - MARGIN, y },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    });
    y -= LINE_HEIGHT;
  }

  // Title
  page.drawText(TITLE, {
    x: MARGIN,
    y,
    size: FONT_SIZE_TITLE,
    font: fontBold,
    color: black,
  });
  y -= LINE_HEIGHT * 1.2;

  page.drawText("Payment receipt", {
    x: MARGIN,
    y,
    size: FONT_SIZE,
    font: font,
    color: gray,
  });
  y -= LINE_HEIGHT * 1.5;

  drawLine();

  // Order info
  drawText(`Order #${order.orderNumber}`, { font: fontBold });
  drawText(`Date: ${new Date(order.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}`);
  drawText(`Customer: ${order.customer.name ?? order.customer.email}`);
  y -= LINE_HEIGHT * 0.5;

  drawLine();

  // Pickup / Delivery
  drawText("Pickup", { font: fontBold });
  drawText(
    `${formatAddress(order.pickupAddress)}`,
    { size: FONT_SIZE_SMALL }
  );
  drawText(
    `${formatDate(order.pickupDate)}${order.pickupTimeSlot ? ` · ${order.pickupTimeSlot}` : ""}`,
    { size: FONT_SIZE_SMALL, color: gray }
  );
  y -= LINE_HEIGHT * 0.5;

  drawText("Delivery", { font: fontBold });
  drawText(
    `${formatAddress(order.deliveryAddress)}`,
    { size: FONT_SIZE_SMALL }
  );
  drawText(
    `${formatDate(order.deliveryDate)}${order.deliveryTimeSlot ? ` · ${order.deliveryTimeSlot}` : ""}`,
    { size: FONT_SIZE_SMALL, color: gray }
  );
  y -= LINE_HEIGHT;

  drawLine();

  // Loads
  drawText("Loads", { font: fontBold });
  const totalLbs = order.orderLoads.reduce(
    (sum, l) => sum + (Number(l.weightLbs) || 0),
    0
  );
  for (const load of order.orderLoads) {
    const lbs = load.weightLbs != null ? load.weightLbs.toFixed(1) : "—";
    drawText(`  Load ${load.loadNumber}: ${lbs} lbs`, { size: FONT_SIZE_SMALL });
  }
  y -= LINE_HEIGHT * 0.5;

  drawLine();

  // Total
  const totalDollars = (Math.round(order.totalCents) / 100).toFixed(2);
  drawText(`Total paid: $${totalDollars}`, { font: fontBold, size: 12 });
  y -= LINE_HEIGHT;

  drawText("Thank you for your business.", { color: gray, size: FONT_SIZE_SMALL });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}

function formatAddress(addr: { street: string; city: string; state: string; zip: string }): string {
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}`;
}

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-US", { dateStyle: "medium" });
}
