// GL VAULT ENCRYPTION ENGINE // LABCORE
// Standards: AES-GCM 256-bit with PBKDF2-derived keys, unique 96-bit IV per encryption.

export interface EncryptedVaultPayload {
  ciphertext: string; // Base64
  iv: string;         // Base64
  salt: string;       // Base64
  version: "1.0-aes-gcm";
  timestamp: string;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Derives a cryptographic AES-GCM 256-bit key from a user passphrase and salt
async function deriveAesGcmKey(passphrase: string, saltBuffer: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// Encrypts arbitrary serializable data using AES-GCM
export async function encryptVaultData<T>(
  data: T,
  encryptionPassphrase: string
): Promise<EncryptedVaultPayload> {
  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(data));

  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);

  const iv = new Uint8Array(12); // Standard 96-bit IV for AES-GCM
  crypto.getRandomValues(iv);

  const key = await deriveAesGcmKey(encryptionPassphrase, salt);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
    iv: arrayBufferToBase64(iv.buffer),
    salt: arrayBufferToBase64(salt.buffer),
    version: "1.0-aes-gcm",
    timestamp: new Date().toISOString(),
  };
}

// Decrypts an EncryptedVaultPayload using the user passphrase
export async function decryptVaultData<T>(
  payload: EncryptedVaultPayload,
  encryptionPassphrase: string
): Promise<T> {
  const salt = new Uint8Array(base64ToArrayBuffer(payload.salt));
  const iv = new Uint8Array(base64ToArrayBuffer(payload.iv));
  const ciphertext = base64ToArrayBuffer(payload.ciphertext);

  const key = await deriveAesGcmKey(encryptionPassphrase, salt);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  const dec = new TextDecoder();
  const jsonStr = dec.decode(decryptedBuffer);
  return JSON.parse(jsonStr) as T;
}
