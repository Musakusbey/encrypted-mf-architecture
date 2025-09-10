import CryptoJS from "crypto-js";

class EncryptionUtil {
  private key: string;
  private algorithm: string = "AES";

  constructor() {
    // Frontend için şifreleme anahtarı (gerçek projede güvenli bir şekilde yönetilmeli)
    this.key = "mikrofrontend_encryption_key_32_chars";
  }

  // Veriyi şifrele
  encrypt(data: any): any {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.key).toString();

      return {
        encrypted: encrypted,
        timestamp: Date.now(),
        version: "1.0.0",
      };
    } catch (error) {
      console.error("Şifreleme hatası:", error);
      throw new Error("Veri şifrelenemedi");
    }
  }

  // Veriyi çöz
  decrypt(encryptedData: any): any {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData.encrypted, this.key);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

      if (!decryptedString) {
        throw new Error("Şifre çözülemedi");
      }

      return JSON.parse(decryptedString);
    } catch (error) {
      console.error("Şifre çözme hatası:", error);
      throw new Error("Veri çözülemedi");
    }
  }

  // Hash oluştur
  createHash(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }

  // Rastgele token oluştur
  generateToken(length: number = 32): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Veri bütünlüğünü kontrol et
  verifyIntegrity(originalData: any, receivedHash: string): boolean {
    const calculatedHash = this.createHash(JSON.stringify(originalData));
    return calculatedHash === receivedHash;
  }
}

export default new EncryptionUtil();
