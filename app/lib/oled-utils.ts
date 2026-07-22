// OLED conversion utilities for SSD1306 128x128

export function canvasToOledBytes(ctx: CanvasRenderingContext2D): Uint8Array {
  const imgData = ctx.getImageData(0, 0, 128, 128).data;
  const oledBytes = new Uint8Array(2048);
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 128; x++) {
      const idx = (y * 128 + x) * 4;
      const bright = imgData[idx] ?? 0;
      if (bright > 128) {
        const byteIdx = Math.floor(y / 8) * 128 + x;
        oledBytes[byteIdx] |= 1 << (y % 8);
      }
    }
  }
  return oledBytes;
}

export function hexToBytes(hex: string): Uint8Array {
  if (!hex) return new Uint8Array();
  const s = String(hex).replace(/[^0-9A-Fa-f]/g, '');
  const len = Math.floor(s.length / 2);
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = parseInt(s.substr(i * 2, 2), 16);
  }
  return out;
}

export function padTo2048Bytes(hex: string): string {
  if (!hex) return '00'.repeat(2048);
  const cleaned = String(hex).replace(/[^0-9A-Fa-f]/g, '');
  const needed = 2048 * 2 - cleaned.length;
  if (needed <= 0) return cleaned.substr(0, 2048 * 2).toUpperCase();
  return (cleaned + '0'.repeat(needed)).toUpperCase();
}

export function renderOledBytesVariant(
  ctx: CanvasRenderingContext2D,
  bytes: Uint8Array,
  mode: string = 'standard'
) {
  const w = 128;
  const h = 128;
  const img = ctx.createImageData(w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i] = 0;
    img.data[i + 1] = 0;
    img.data[i + 2] = 0;
    img.data[i + 3] = 255;
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let bit = 0;
      try {
        if (mode === 'standard') {
          const byteIdx = Math.floor(y / 8) * w + x;
          bit = ((bytes?.[byteIdx] ?? 0) >> (y % 8)) & 1;
        } else if (mode === 'rows') {
          const byteIdx = y * (w / 8) + Math.floor(x / 8);
          bit = ((bytes?.[byteIdx] ?? 0) >> (7 - (x % 8))) & 1;
        } else if (mode === 'revbit') {
          const byteIdx = Math.floor(y / 8) * w + x;
          bit = ((bytes?.[byteIdx] ?? 0) >> (7 - (y % 8))) & 1;
        } else if (mode === 'transpose') {
          const byteIdx = Math.floor(x / 8) * h + y;
          bit = ((bytes?.[byteIdx] ?? 0) >> (x % 8)) & 1;
        } else if (mode === 'invert') {
          const byteIdx = Math.floor(y / 8) * w + x;
          bit = ((bytes?.[byteIdx] ?? 0) >> (y % 8)) & 1 ? 0 : 1;
        }
      } catch {
        bit = 0;
      }

      const i = (y * w + x) * 4;
      const color = bit ? 255 : 0;
      img.data[i] = color;
      img.data[i + 1] = color;
      img.data[i + 2] = color;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

export function countLitPixels(bytes: Uint8Array, mode: string): number {
  const w = 128;
  const h = 128;
  let count = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let bit = 0;
      try {
        if (mode === 'standard') {
          const byteIdx = Math.floor(y / 8) * w + x;
          bit = ((bytes?.[byteIdx] ?? 0) >> (y % 8)) & 1;
        } else if (mode === 'revbit') {
          const byteIdx = Math.floor(y / 8) * w + x;
          bit = ((bytes?.[byteIdx] ?? 0) >> (7 - (y % 8))) & 1;
        } else if (mode === 'transpose') {
          const byteIdx = Math.floor(x / 8) * h + y;
          bit = ((bytes?.[byteIdx] ?? 0) >> (x % 8)) & 1;
        } else if (mode === 'rows') {
          const byteIdx = y * (w / 8) + Math.floor(x / 8);
          bit = ((bytes?.[byteIdx] ?? 0) >> (7 - (x % 8))) & 1;
        } else if (mode === 'invert') {
          const byteIdx = Math.floor(y / 8) * w + x;
          bit = ((bytes?.[byteIdx] ?? 0) >> (y % 8)) & 1 ? 0 : 1;
        }
      } catch {
        bit = 0;
      }
      if (bit) count++;
    }
  }
  return count;
}

export function pickBestModeForHex(hex: string): string {
  try {
    const bytes = hexToBytes(hex);
    const modes = ['standard', 'rows', 'revbit', 'transpose', 'invert'];
    const results = modes.map((m) => ({ mode: m, lit: countLitPixels(bytes, m) }));
    const scored = results.map((r) => ({ ...r, score: Math.abs(r.lit - 4000) }));
    scored.sort((a, b) => a.score - b.score);
    return scored?.[0]?.mode ?? 'standard';
  } catch {
    return 'standard';
  }
}
