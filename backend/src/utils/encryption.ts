import crypto from 'crypto';

export interface EncryptionResult {
  encryptedData: string;
  iv: string;
}

export interface DecryptionResult {
  decryptedData: string;
}

export class EncryptionUtil {
  private static readonly ALGORITHM = 'aes-256-cbc';
  private static readonly IV_LENGTH = 16; // For CBC mode
  private static readonly KEY_LENGTH = 32; // For AES-256

  /**
   * Creates a hash of a password using PBKDF2
   */
  static createHash(password: string, salt: string): string {
    const iterations = 10000;
    const keylen = 64;
    const digest = 'sha512';

    return crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString('hex');
  }

  /**
   * Generates a random salt
   */
  static generateSalt(length: number = 32): string {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
  }

  /**
   * Encrypts data using AES-256-CBC
   */
  static encrypt(text: string, encryptionKey: string): EncryptionResult {
    // Create a buffer from the encryption key
    const key = Buffer.from(encryptionKey, 'utf-8').slice(0, this.KEY_LENGTH);

    // Pad the key if it's shorter than required length
    if (key.length < this.KEY_LENGTH) {
      const paddedKey = Buffer.alloc(this.KEY_LENGTH);
      key.copy(paddedKey);
      // Fill remaining bytes with zeros
      for (let i = key.length; i < this.KEY_LENGTH; i++) {
        paddedKey[i] = 0;
      }
      return this.encryptWithKey(text, paddedKey);
    }

    return this.encryptWithKey(text, key);
  }

  /**
   * Helper method to encrypt with a properly sized key
   */
  private static encryptWithKey(text: string, key: Buffer): EncryptionResult {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipher(this.ALGORITHM, key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encryptedData: encrypted,
      iv: iv.toString('hex')
    };
  }

  /**
   * Decrypts data using AES-256-CBC
   */
  static decrypt(encryptedData: string, encryptionKey: string, ivString: string): string {
    // Create a buffer from the encryption key
    const key = Buffer.from(encryptionKey, 'utf-8').slice(0, this.KEY_LENGTH);

    // Pad the key if it's shorter than required length
    if (key.length < this.KEY_LENGTH) {
      const paddedKey = Buffer.alloc(this.KEY_LENGTH);
      key.copy(paddedKey);
      // Fill remaining bytes with zeros
      for (let i = key.length; i < this.KEY_LENGTH; i++) {
        paddedKey[i] = 0;
      }
      return this.decryptWithKey(encryptedData, paddedKey, ivString);
    }

    return this.decryptWithKey(encryptedData, key, ivString);
  }

  /**
   * Helper method to decrypt with a properly sized key
   */
  private static decryptWithKey(encryptedData: string, key: Buffer, ivString: string): string {
    const iv = Buffer.from(ivString, 'hex');
    const decipher = crypto.createDecipher(this.ALGORITHM, key);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Encrypts a buffer
   */
  static encryptBuffer(buffer: Buffer, encryptionKey: string): Buffer {
    const key = Buffer.from(encryptionKey, 'utf-8').slice(0, this.KEY_LENGTH);
    const paddedKey = this.padKey(key);

    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipher(this.ALGORITHM, paddedKey);

    const encrypted = Buffer.concat([
      iv,
      cipher.update(buffer),
      cipher.final()
    ]);

    return encrypted;
  }

  /**
   * Decrypts a buffer
   */
  static decryptBuffer(buffer: Buffer, encryptionKey: string): Buffer {
    const key = Buffer.from(encryptionKey, 'utf-8').slice(0, this.KEY_LENGTH);
    const paddedKey = this.padKey(key);

    const iv = buffer.slice(0, this.IV_LENGTH);
    const encryptedData = buffer.slice(this.IV_LENGTH);

    const decipher = crypto.createDecipher(this.ALGORITHM, paddedKey);
    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final()
    ]);

    return decrypted;
  }

  /**
   * Pads the key to the required length
   */
  private static padKey(key: Buffer): Buffer {
    if (key.length === this.KEY_LENGTH) {
      return key;
    }

    const paddedKey = Buffer.alloc(this.KEY_LENGTH);
    key.copy(paddedKey);

    // Fill remaining bytes with zeros
    for (let i = key.length; i < this.KEY_LENGTH; i++) {
      paddedKey[i] = 0;
    }

    return paddedKey;
  }

  /**
   * Generates a cryptographically secure random string
   */
  static generateRandomString(length: number): string {
    return crypto.randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }
}