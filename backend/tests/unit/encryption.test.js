const encryption = require('../../utils/encryption');

describe('Encryption Utils', () => {
    test('should encrypt and decrypt text', () => {
        const originalText = 'Hello, World!';
        const encrypted = encryption.encrypt(originalText);
        const decrypted = encryption.decrypt(encrypted);

        expect(decrypted).toBe(originalText);
    });

    test('should encrypt and decrypt JSON', () => {
        const originalData = { message: 'Test data', number: 123 };
        const encrypted = encryption.encryptJSON(originalData);
        const decrypted = encryption.decryptJSON(encrypted);

        expect(decrypted).toEqual(originalData);
    });

    test('should create and verify HMAC', () => {
        const data = 'test data';
        const secret = 'test secret';

        const signature = encryption.createHMAC(data, secret);
        const isValid = encryption.verifyHMAC(data, signature, secret);

        expect(signature).toBeDefined();
        expect(isValid).toBe(true);
    });

    test('should generate token', () => {
        const token = encryption.generateToken(32);

        expect(token).toBeDefined();
        expect(token.length).toBe(64); // 32 bytes = 64 hex chars
    });
});
