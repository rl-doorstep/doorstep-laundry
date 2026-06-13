/**
 * Brother PT-Touch raster protocol over raw TCP (port 9100).
 *
 * The QL-820NWB does NOT respond to ESC i S status requests over TCP, and its
 * firmware validates the ESC i z media bytes against the roll RFID regardless
 * of the PI flags byte.  The workaround is to omit ESC i z entirely — the
 * printer reads tape width/type from its own RFID chip and we just stream
 * raster data terminated by 0x1A (print-and-cut).
 */
import net from "net";
import sharp from "sharp";

// QL-820NWB at 300 DPI: 62 mm tape = 720 printable dots = 90 bytes/row
export const PT_DOTS_W = 720;
const BYTES_PER_ROW = PT_DOTS_W / 8; // 90

// ---------------------------------------------------------------------------
// Image → packed-bit raster rows
// ---------------------------------------------------------------------------

async function pngToRasterRows(png: Buffer, dotH: number): Promise<Buffer[]> {
  const { data: raw } = await sharp(png)
    .resize(PT_DOTS_W, dotH, { fit: "contain", background: "white" })
    .flatten({ background: "white" })
    .grayscale()
    .threshold(128)  // 0 = black (print dot)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rows: Buffer[] = [];
  for (let r = 0; r < dotH; r++) {
    const row = Buffer.alloc(BYTES_PER_ROW, 0);
    let hasInk = false;
    for (let c = 0; c < PT_DOTS_W; c++) {
      if (raw[r * PT_DOTS_W + c] === 0) {
        row[c >> 3] |= 1 << (7 - (c & 7));
        hasInk = true;
      }
    }
    rows.push(hasInk ? row : Buffer.alloc(0));
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Packet builder — ESC i z intentionally omitted
// ---------------------------------------------------------------------------

function buildPacket(rows: Buffer[]): Buffer {
  const parts: Buffer[] = [];

  // 1. Invalidate — clears any stuck state
  parts.push(Buffer.alloc(200, 0x00));

  // 2. ESC @ — initialize / reset
  parts.push(Buffer.from([0x1b, 0x40]));

  // 3. ESC i a 01 — switch to raster graphics mode (required on QL-820NWB)
  parts.push(Buffer.from([0x1b, 0x69, 0x61, 0x01]));

  // ESC i z (set media) deliberately omitted.
  // The firmware validates media bytes against the roll RFID regardless of
  // PI flags, causing "wrong roll type" with any hardcoded values.
  // Without ESC i z the printer reads tape width/type from RFID itself.

  // 4. ESC i M 40 — auto-cut after each label
  parts.push(Buffer.from([0x1b, 0x69, 0x4d, 0x40]));

  // 5. ESC i A 01 — cut each 1 label
  parts.push(Buffer.from([0x1b, 0x69, 0x41, 0x01]));

  // 6. ESC i d 00 00 — zero extra feed
  parts.push(Buffer.from([0x1b, 0x69, 0x64, 0x00, 0x00]));

  // 7. Raster lines
  //    0x5A = blank line shorthand  |  0x47 lo hi data... = inked line
  for (const row of rows) {
    if (row.length === 0) {
      parts.push(Buffer.from([0x5a]));
    } else {
      const cmd = Buffer.allocUnsafe(3 + BYTES_PER_ROW);
      cmd[0] = 0x47;
      cmd[1] = BYTES_PER_ROW;
      cmd[2] = 0x00;
      row.copy(cmd, 3);
      parts.push(cmd);
    }
  }

  // 8. Print and cut
  parts.push(Buffer.from([0x1a]));

  return Buffer.concat(parts);
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function printLabelTcp(
  host: string,
  port: number,
  png: Buffer,
  dotH: number
): Promise<void> {
  const rows = await pngToRasterRows(png, dotH);
  const packet = buildPacket(rows);

  console.log(
    `[pt-print] Connecting to ${host}:${port} — ` +
    `packet ${packet.length} bytes, ${rows.length} raster rows, ` +
    `${rows.filter(r => r.length > 0).length} inked`
  );

  return new Promise((resolve, reject) => {
    const sock = net.createConnection({ host, port });

    const hardTimer = setTimeout(() => {
      sock.destroy();
      reject(new Error(`Printer TCP hard timeout (10 s) — ` +
        `check that ${host}:${port} is reachable and the printer is online`));
    }, 10_000);

    const done = (err?: Error) => {
      clearTimeout(hardTimer);
      sock.destroy();
      err ? reject(err) : resolve();
    };

    sock.on("connect", () => {
      console.log(`[pt-print] Connected — writing ${packet.length} bytes`);
      sock.write(packet, (writeErr) => {
        if (writeErr) { done(writeErr); return; }
        // Graceful half-close: tell the printer we're done sending.
        // sock.end() flushes the OS send buffer before sending FIN,
        // so the printer receives every byte before the connection closes.
        console.log("[pt-print] Write flushed — sending FIN, waiting for printer to close");
        sock.end();
      });
    });

    // Printer closed its end — job accepted and queued
    sock.on("close", () => {
      console.log("[pt-print] Connection closed by printer — done");
      done();
    });

    sock.on("error", (err) => {
      console.error("[pt-print] Socket error:", err.message);
      done(err);
    });

    // Log any status bytes the printer sends back (32-byte status packets)
    sock.on("data", (chunk: Buffer) => {
      console.log(`[pt-print] Printer → ${chunk.length} bytes:`, chunk.toString("hex"));
    });
  });
}
