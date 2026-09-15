// GL TOTP ENGINE // RFC 6238 COMPLIANT IMPLEMENTATION
// Built using Web Crypto API (HMAC-SHA1) with Base32 Secret encoding

// Base32 RFC 4648 alphabet
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateTotpSecret(byteLength = 20): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32ToUint8Array(base32: string): Uint8Array {
  const clean = base32.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_CHARS.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

// Generates 6-digit TOTP token for a given timestamp (step = 30s)
export async function generateTotpToken(
  secretBase32: string,
  timestampMs = Date.now(),
  stepSeconds = 30
): Promise<string> {
  const timeStep = Math.floor(timestampMs / 1000 / stepSeconds);
  const timeBuffer = new ArrayBuffer(8);
  const dataView = new DataView(timeBuffer);
  // Big-endian 64-bit integer
  dataView.setUint32(0, Math.floor(timeStep / 0x100000000), false);
  dataView.setUint32(4, timeStep & 0xffffffff, false);

  const keyBytes = base32ToUint8Array(secretBase32);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: { name: "SHA-1" } },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, timeBuffer);
  const hmac = new Uint8Array(signature);

  // Dynamic truncation
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binaryCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binaryCode % 1000000;
  return otp.toString().padStart(6, "0");
}

// Verifies a TOTP token with ±1 step tolerance (RFC 6238 time drift protection)
export async function verifyTotpToken(
  secretBase32: string,
  token: string,
  toleranceSteps = 1,
  timestampMs = Date.now()
): Promise<boolean> {
  const cleanToken = token.trim().replace(/\s/g, "");
  if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) {
    return false;
  }

  for (let stepOffset = -toleranceSteps; stepOffset <= toleranceSteps; stepOffset++) {
    const checkTime = timestampMs + stepOffset * 30 * 1000;
    const expected = await generateTotpToken(secretBase32, checkTime);
    if (expected === cleanToken) {
      return true;
    }
  }

  return false;
}

// Generates an otpauth:// URI for standard authenticator apps (Google Authenticator, Authy, etc.)
export function generateOtpAuthUri(
  accountName: string,
  issuer: string,
  secretBase32: string
): string {
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  const encIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${label}?secret=${secretBase32}&issuer=${encIssuer}&algorithm=SHA1&digits=6&period=30`;
}
