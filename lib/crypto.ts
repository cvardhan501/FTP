/**
 * WebCrypto AES-256-GCM E2E Encryption Engine
 */

export async function generateAESKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function deriveKeyFromPassword(password: string, saltHex: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const salt = hexToUint8Array(saltHex);

  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function exportKeyRaw(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("raw", key);
  return arrayBufferToHex(exported);
}

export async function importKeyRaw(hexKey: string): Promise<CryptoKey> {
  const buffer = hexToUint8Array(hexKey);
  return await window.crypto.subtle.importKey(
    "raw",
    buffer as unknown as BufferSource,
    "AES-GCM",
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptChunk(
  key: CryptoKey,
  data: ArrayBuffer,
  ivUint8: Uint8Array
): Promise<ArrayBuffer> {
  return await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: ivUint8 as unknown as BufferSource,
    },
    key,
    data
  );
}

export async function decryptChunk(
  key: CryptoKey,
  encryptedData: ArrayBuffer,
  ivUint8: Uint8Array
): Promise<ArrayBuffer> {
  return await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: ivUint8 as unknown as BufferSource,
    },
    key,
    encryptedData
  );
}

export function generateRandomIV(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(12));
}

export function generateRandomSalt(): string {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  return arrayBufferToHex(salt.buffer);
}

export function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToUint8Array(hexString: string): Uint8Array {
  const matches = hexString.match(/.{1,2}/g);
  if (!matches) return new Uint8Array();
  return new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
}
