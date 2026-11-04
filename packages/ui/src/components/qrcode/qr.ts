/**
 * QR Code encoding (ISO/IEC 18004): numeric, alphanumeric and byte (UTF-8) modes, one chosen automatically,
 * versions 1–40, error correction levels L / M / Q / H, mask chosen automatically. The structure follows Nayuki's public implementation, with no library dependency.
 */

export type QRErrorLevel = "L" | "M" | "Q" | "H";

const LEVEL_INDEX: Record<QRErrorLevel, number> = { L: 0, M: 1, Q: 2, H: 3 };
/** The two-bit encoding of the error correction level in the format information; the order differs from L M Q H. */
const FORMAT_BITS = [1, 0, 3, 2];

// For each version and level: number of error correction codewords per block, and number of blocks (index 0 is a placeholder)
const ECC_PER_BLOCK = [
  [
    -1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30,
    30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
  [
    -1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28,
    28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
  ],
  [
    -1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30,
    30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
  [
    -1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
];
const NUM_BLOCKS = [
  [
    -1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14,
    15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25,
  ],
  [
    -1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23,
    25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49,
  ],
  [
    -1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34,
    34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68,
  ],
  [
    -1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35,
    37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81,
  ],
];

const ALNUM = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";

type Mode = "numeric" | "alphanumeric" | "byte";
const MODE_BITS: Record<Mode, number> = { numeric: 0x1, alphanumeric: 0x2, byte: 0x4 };
const COUNT_BITS: Record<Mode, [number, number, number]> = {
  numeric: [10, 12, 14],
  alphanumeric: [9, 11, 13],
  byte: [8, 16, 16],
};
const countBits = (mode: Mode, version: number) =>
  COUNT_BITS[mode][version <= 9 ? 0 : version <= 26 ? 1 : 2];

export interface QRMatrix {
  version: number;
  /** Number of modules per side. */
  size: number;
  /** modules[y][x], true is dark. */
  modules: boolean[][];
}

function bitsOf(value: number, length: number, out: number[]) {
  for (let i = length - 1; i >= 0; i--) out.push((value >>> i) & 1);
}

function chooseMode(text: string): Mode {
  if (/^[0-9]*$/.test(text)) return "numeric";
  if (/^[0-9A-Z $%*+\-./:]*$/.test(text)) return "alphanumeric";
  return "byte";
}

/** The data bits for the content (excluding the mode header and character count) and the character count. */
function segmentData(text: string, mode: Mode): { bits: number[]; count: number } {
  const bits: number[] = [];
  if (mode === "numeric") {
    for (let i = 0; i < text.length;) {
      const n = Math.min(3, text.length - i);
      bitsOf(Number(text.slice(i, i + n)), n * 3 + 1, bits);
      i += n;
    }
    return { bits, count: text.length };
  }
  if (mode === "alphanumeric") {
    const chars = text.split(""); // all ASCII by now, so splitting by character is safe
    for (let i = 0; i < chars.length; i += 2) {
      if (i + 1 < chars.length) {
        bitsOf(ALNUM.indexOf(chars[i]!) * 45 + ALNUM.indexOf(chars[i + 1]!), 11, bits);
      } else bitsOf(ALNUM.indexOf(chars[i]!), 6, bits);
    }
    return { bits, count: chars.length };
  }
  const bytes = new TextEncoder().encode(text);
  for (const b of bytes) bitsOf(b, 8, bits);
  return { bits, count: bytes.length };
}

function rawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const align = Math.floor(version / 7) + 2;
    result -= (25 * align - 10) * align - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

const dataCodewords = (version: number, level: number) =>
  Math.floor(rawDataModules(version) / 8) -
  ECC_PER_BLOCK[level]![version]! * NUM_BLOCKS[level]![version]!;

function gfMultiply(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function rsDivisor(degree: number): number[] {
  const result = Array.from({ length: degree }, () => 0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = gfMultiply(result[j]!, root);
      if (j + 1 < degree) result[j]! ^= result[j + 1]!;
    }
    root = gfMultiply(root, 0x02);
  }
  return result;
}

function rsRemainder(data: number[], divisor: number[]): number[] {
  const result = divisor.map(() => 0);
  for (const b of data) {
    const factor = b ^ result.shift()!;
    result.push(0);
    divisor.forEach((coef, i) => {
      result[i]! ^= gfMultiply(coef, factor);
    });
  }
  return result;
}

function interleave(data: number[], version: number, level: number): number[] {
  const blocks = NUM_BLOCKS[level]![version]!;
  const eccLen = ECC_PER_BLOCK[level]![version]!;
  const raw = Math.floor(rawDataModules(version) / 8);
  const short = blocks - (raw % blocks);
  const shortLen = Math.floor(raw / blocks);
  const divisor = rsDivisor(eccLen);
  const all: number[][] = [];
  for (let i = 0, k = 0; i < blocks; i++) {
    const dat = data.slice(k, k + shortLen - eccLen + (i < short ? 0 : 1));
    k += dat.length;
    const ecc = rsRemainder(dat, divisor);
    if (i < short) dat.push(0);
    all.push(dat.concat(ecc));
  }
  const result: number[] = [];
  for (let i = 0; i < all[0]!.length; i++) {
    all.forEach((block, j) => {
      if (i !== shortLen - eccLen || j >= short) result.push(block[i]!);
    });
  }
  return result;
}

const bit = (x: number, i: number) => ((x >>> i) & 1) !== 0;

class Builder {
  readonly size: number;
  readonly modules: boolean[][];
  private readonly isFunction: boolean[][];

  private readonly version: number;
  private readonly level: number;

  constructor(version: number, level: number) {
    this.version = version;
    this.level = level;
    this.size = version * 4 + 17;
    this.modules = Array.from({ length: this.size }, () =>
      Array.from({ length: this.size }, () => false),
    );
    this.isFunction = Array.from({ length: this.size }, () =>
      Array.from({ length: this.size }, () => false),
    );
    this.drawFunctionPatterns();
  }

  private set(x: number, y: number, dark: boolean) {
    this.modules[y]![x] = dark;
    this.isFunction[y]![x] = true;
  }

  private drawFunctionPatterns() {
    const { size } = this;
    for (let i = 0; i < size; i++) {
      this.set(6, i, i % 2 === 0);
      this.set(i, 6, i % 2 === 0);
    }
    this.finder(3, 3);
    this.finder(size - 4, 3);
    this.finder(3, size - 4);
    const pos = this.alignmentPositions();
    const n = pos.length;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (!((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0))) {
          this.alignment(pos[i]!, pos[j]!);
        }
      }
    }
    this.formatBits(0);
    this.versionBits();
  }

  private alignmentPositions(): number[] {
    if (this.version === 1) return [];
    const n = Math.floor(this.version / 7) + 2;
    const step = this.version === 32 ? 26 : Math.ceil((this.version * 4 + 4) / (n * 2 - 2)) * 2;
    const result = [6];
    for (let pos = this.size - 7; result.length < n; pos -= step) result.splice(1, 0, pos);
    return result;
  }

  private finder(x: number, y: number) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const xx = x + dx;
        const yy = y + dy;
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) {
          this.set(xx, yy, dist !== 2 && dist !== 4);
        }
      }
    }
  }

  private alignment(x: number, y: number) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        this.set(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  }

  formatBits(mask: number) {
    const data = (FORMAT_BITS[this.level]! << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;
    const { size } = this;
    for (let i = 0; i <= 5; i++) this.set(8, i, bit(bits, i));
    this.set(8, 7, bit(bits, 6));
    this.set(8, 8, bit(bits, 7));
    this.set(7, 8, bit(bits, 8));
    for (let i = 9; i < 15; i++) this.set(14 - i, 8, bit(bits, i));
    for (let i = 0; i < 8; i++) this.set(size - 1 - i, 8, bit(bits, i));
    for (let i = 8; i < 15; i++) this.set(8, size - 15 + i, bit(bits, i));
    this.set(8, size - 8, true);
  }

  private versionBits() {
    if (this.version < 7) return;
    let rem = this.version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (this.version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const dark = bit(bits, i);
      const a = this.size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      this.set(a, b, dark);
      this.set(b, a, dark);
    }
  }

  drawCodewords(data: number[]) {
    const { size } = this;
    let i = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? size - 1 - vert : vert;
          if (!this.isFunction[y]![x] && i < data.length * 8) {
            this.modules[y]![x] = bit(data[i >>> 3]!, 7 - (i & 7));
            i++;
          }
        }
      }
    }
  }

  applyMask(mask: number) {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        let invert: boolean;
        switch (mask) {
          case 0:
            invert = (x + y) % 2 === 0;
            break;
          case 1:
            invert = y % 2 === 0;
            break;
          case 2:
            invert = x % 3 === 0;
            break;
          case 3:
            invert = (x + y) % 3 === 0;
            break;
          case 4:
            invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
            break;
          case 5:
            invert = ((x * y) % 2) + ((x * y) % 3) === 0;
            break;
          case 6:
            invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
            break;
          default:
            invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
        }
        if (!this.isFunction[y]![x] && invert) this.modules[y]![x] = !this.modules[y]![x];
      }
    }
  }

  penalty(): number {
    const { size, modules } = this;
    let result = 0;
    const addHistory = (run: number, history: number[]) => {
      if (history[0] === 0) run += size;
      history.pop();
      history.unshift(run);
    };
    const countPatterns = (h: number[]) => {
      const n = h[1]!;
      const core = n > 0 && h[2] === n && h[3] === n * 3 && h[4] === n && h[5] === n;
      return (
        (core && h[0]! >= n * 4 && h[6]! >= n ? 1 : 0) +
        (core && h[6]! >= n * 4 && h[0]! >= n ? 1 : 0)
      );
    };
    const scan = (get: (a: number, b: number) => boolean) => {
      for (let a = 0; a < size; a++) {
        let color = false;
        let run = 0;
        const history = [0, 0, 0, 0, 0, 0, 0];
        for (let b = 0; b < size; b++) {
          if (get(a, b) === color) {
            run++;
            if (run === 5) result += 3;
            else if (run > 5) result++;
          } else {
            addHistory(run, history);
            if (!color) result += countPatterns(history) * 40;
            color = get(a, b);
            run = 1;
          }
        }
        if (color) {
          addHistory(run, history);
          run = 0;
        }
        run += size;
        addHistory(run, history);
        result += countPatterns(history) * 40;
      }
    };
    scan((y, x) => modules[y]![x]!);
    scan((x, y) => modules[y]![x]!);
    for (let y = 0; y < size - 1; y++) {
      for (let x = 0; x < size - 1; x++) {
        const c = modules[y]![x]!;
        if (c === modules[y]![x + 1] && c === modules[y + 1]![x] && c === modules[y + 1]![x + 1]) {
          result += 3;
        }
      }
    }
    let dark = 0;
    for (const row of modules) for (const m of row) if (m) dark++;
    const total = size * size;
    result += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
    return result;
  }
}

/** Thrown when the content does not fit in the largest version (40). */
export class QRTooLongError extends Error {
  constructor() {
    super("QR code: the data is too long for the chosen error correction level");
  }
}

export function encodeQR(text: string, level: QRErrorLevel = "M", minVersion = 1): QRMatrix {
  const lv = LEVEL_INDEX[level];
  const mode = chooseMode(text);
  const { bits: payload, count } = segmentData(text, mode);

  let version = Math.max(1, Math.min(40, minVersion));
  let capacity = 0;
  for (; ; version++) {
    capacity = dataCodewords(version, lv) * 8;
    const used = 4 + countBits(mode, version) + payload.length;
    const fits = count < 1 << countBits(mode, version);
    if (fits && used <= capacity) break;
    if (version >= 40) throw new QRTooLongError();
  }

  const bits: number[] = [];
  bitsOf(MODE_BITS[mode], 4, bits);
  bitsOf(count, countBits(mode, version), bits);
  bits.push(...payload);
  bitsOf(0, Math.min(4, capacity - bits.length), bits); // terminator
  while (bits.length % 8 !== 0) bits.push(0);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    data.push(bits.slice(i, i + 8).reduce((acc, b) => (acc << 1) | b, 0));
  }
  for (let pad = 0xec; data.length < capacity / 8; pad ^= 0xec ^ 0x11) data.push(pad);

  const builder = new Builder(version, lv);
  builder.drawCodewords(interleave(data, version, lv));

  // Pick the mask with the lowest penalty score
  let best = 0;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    builder.applyMask(mask);
    builder.formatBits(mask);
    const score = builder.penalty();
    if (score < bestScore) {
      best = mask;
      bestScore = score;
    }
    builder.applyMask(mask); // XOR again to undo it
  }
  builder.applyMask(best);
  builder.formatBits(best);
  return { version, size: builder.size, modules: builder.modules };
}
