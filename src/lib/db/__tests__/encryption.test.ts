import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../encryption';

describe('encryption', () => {
  it('encrypts and decrypts a string', () => {
    const original = 'Hello, brutalist world!';
    const encrypted = encrypt(original);
    expect(encrypted).not.toBe(original);
    expect(encrypted.split(':')).toHaveLength(3);

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it('produces different ciphertexts for the same plaintext', () => {
    const plain = 'Sensitive student data';
    const a = encrypt(plain);
    const b = encrypt(plain);
    expect(a).not.toBe(b);
  });

  it('handles empty strings', () => {
    const encrypted = encrypt('');
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe('');
  });

  it('handles JSON strings', () => {
    const data = JSON.stringify({ ssn: '123-45-6789', phone: '+1-555-0100' });
    const encrypted = encrypt(data);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(data);
    expect(JSON.parse(decrypted)).toEqual({
      ssn: '123-45-6789',
      phone: '+1-555-0100',
    });
  });

  it('throws on invalid ciphertext', () => {
    expect(() => decrypt('not-valid-format')).toThrow();
    expect(() => decrypt('short')).toThrow();
  });

  it('throws on tampered ciphertext', () => {
    const encrypted = encrypt('secret data');
    const parts = encrypted.split(':');
    parts[2] = parts[2].replace(/^.{4}/, 'dead');
    expect(() => decrypt(parts.join(':'))).toThrow();
  });

  it('handles long strings', () => {
    const long = 'A'.repeat(10000);
    const encrypted = encrypt(long);
    expect(encrypted.length).toBeLessThan(long.length * 3);
    expect(decrypt(encrypted)).toBe(long);
  });
});
