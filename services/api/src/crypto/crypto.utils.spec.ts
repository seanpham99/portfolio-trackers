/**
 * Unit tests for crypto.utils
 * Story: 2.7 Connection Settings
 */

import { encryptSecret, decryptSecret, maskApiKey } from './crypto.utils';

describe('crypto.utils', () => {
  // Set a test encryption key (32 bytes base64 encoded)
  const TEST_KEY = Buffer.from('01234567890123456789012345678901').toString(
    'base64',
  );

  beforeAll(() => {
    process.env.ENCRYPTION_KEY = TEST_KEY;
  });

  afterAll(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  describe('encryptSecret', () => {
    it('should produce non-plaintext output', () => {
      const plaintext = 'my-secret-api-key';
      const encrypted = encryptSecret(plaintext);

      expect(encrypted).not.toBe(plaintext);
      expect(encrypted).not.toContain(plaintext);
    });

    it('should produce different ciphertext for same plaintext (random IV)', () => {
      const plaintext = 'my-secret-api-key';
      const encrypted1 = encryptSecret(plaintext);
      const encrypted2 = encryptSecret(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should produce output in iv:authTag:ciphertext format', () => {
      const plaintext = 'my-secret-api-key';
      const encrypted = encryptSecret(plaintext);

      const parts = encrypted.split(':');
      expect(parts).toHaveLength(3);

      // Each part should be valid base64
      parts.forEach((part) => {
        expect(() => Buffer.from(part, 'base64')).not.toThrow();
      });
    });
  });

  describe('decryptSecret', () => {
    it('should decrypt to original plaintext', () => {
      const plaintext = 'my-super-secret-binance-key-12345';
      const encrypted = encryptSecret(plaintext);
      const decrypted = decryptSecret(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle special characters', () => {
      const plaintext = 'key-with-special-chars!@#$%^&*()_+{}|:<>?';
      const encrypted = encryptSecret(plaintext);
      const decrypted = decryptSecret(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', () => {
      const plaintext = 'key-with-unicode-🔐-🚀-日本語';
      const encrypted = encryptSecret(plaintext);
      const decrypted = decryptSecret(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw on invalid format', () => {
      expect(() => decryptSecret('invalid')).toThrow(
        'Invalid encrypted format',
      );
      expect(() => decryptSecret('only:two')).toThrow(
        'Invalid encrypted format',
      );
    });

    it('should throw on tampered ciphertext', () => {
      const plaintext = 'my-secret';
      const encrypted = encryptSecret(plaintext);
      const parts = encrypted.split(':');

      // Tamper with ciphertext
      const tamperedCiphertext = Buffer.from('tampered').toString('base64');
      const tampered = `${parts[0]}:${parts[1]}:${tamperedCiphertext}`;

      expect(() => decryptSecret(tampered)).toThrow();
    });
  });

  describe('maskApiKey', () => {
    it('should mask key showing only last 4 characters', () => {
      const apiKey = 'abcdefgh12345678';
      const masked = maskApiKey(apiKey);

      expect(masked).toBe('****5678');
    });

    it('should handle short keys', () => {
      expect(maskApiKey('abc')).toBe('****');
      expect(maskApiKey('')).toBe('****');
    });

    it('should handle exactly 4 character keys', () => {
      expect(maskApiKey('abcd')).toBe('****abcd');
    });
  });
});
