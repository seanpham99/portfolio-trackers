/**
 * Crypto utilities for AES-256-GCM encryption/decryption
 * Used for encrypting sensitive API secrets before storing in database
 *
 * Story: 2.7 Connection Settings
 * Architect Decision: Application-level encryption (pgsodium deprecated)
 */

import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment variable
 * Must be exactly 32 bytes (256 bits) for AES-256
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  // Support both raw 32-byte strings and base64-encoded keys
  const keyBuffer = Buffer.from(key, 'base64');
  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(
      `ENCRYPTION_KEY must be exactly ${KEY_LENGTH} bytes (base64 encoded). Got ${keyBuffer.length} bytes.`,
    );
  }

  return keyBuffer;
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 * @param plaintext - The string to encrypt
 * @returns Encrypted string in format: base64(iv):base64(authTag):base64(ciphertext)
 */
export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:ciphertext (all base64)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt an encrypted string using AES-256-GCM
 * @param ciphertext - Encrypted string in format: base64(iv):base64(authTag):base64(ciphertext)
 * @returns Decrypted plaintext string
 */
export function decryptSecret(ciphertext: string): string {
  const key = getEncryptionKey();

  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format. Expected iv:authTag:ciphertext');
  }

  const [ivBase64, authTagBase64, encryptedBase64] = parts;
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const encrypted = Buffer.from(encryptedBase64, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, undefined, 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Mask an API key for display purposes
 * Shows only the last 4 characters
 * @param apiKey - The full API key
 * @returns Masked key like "****abcd"
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 4) {
    return '****';
  }
  return `****${apiKey.slice(-4)}`;
}

/**
 * Generate a random encryption key (for setup purposes)
 * @returns Base64-encoded 32-byte key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('base64');
}
