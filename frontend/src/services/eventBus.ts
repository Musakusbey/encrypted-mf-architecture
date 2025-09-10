import CryptoJS from "crypto-js";

interface SecureEvent {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  signature: string;
  module: string;
}

class SecureEventBus {
  private encryptionKey: string;
  private moduleId: string;
  private listeners: { [eventType: string]: ((data: any) => void)[] } = {};

  constructor(moduleId: string, encryptionKey: string) {
    this.moduleId = moduleId;
    this.encryptionKey = encryptionKey;
  }

  // Event'i şifreleyerek gönder
  publish(eventType: string, data: any) {
    const event: SecureEvent = {
      id: this.generateEventId(),
      type: eventType,
      data: this.encryptData(data),
      timestamp: Date.now(),
      signature: "",
      module: this.moduleId,
    };

    // Event'i imzala
    event.signature = this.signEvent(event);

    console.log(`🔐 [${this.moduleId}] Event published:`, eventType);
    this.dispatchEvent(event);
  }

  // Event'i dinle ve doğrula
  subscribe(eventType: string, callback: (data: any) => void) {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(callback);
  }

  // Event'i dispatch et
  private dispatchEvent(event: SecureEvent) {
    if (this.listeners[event.type]) {
      this.listeners[event.type].forEach(callback => {
        if (this.verifyEvent(event)) {
          const decryptedData = this.decryptData(event.data);
          console.log(`🔓 [${this.moduleId}] Event received:`, event.type);
          callback(decryptedData);
        }
      });
    }
  }

  // Veriyi şifrele
  private encryptData(data: any): string {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, this.encryptionKey).toString();
  }

  // Veriyi çöz
  private decryptData(encryptedData: string): any {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedString);
  }

  // Event'i imzala
  private signEvent(event: Omit<SecureEvent, "signature">): string {
    const eventString = JSON.stringify({
      id: event.id,
      type: event.type,
      data: event.data,
      timestamp: event.timestamp,
      module: event.module,
    });
    return CryptoJS.HmacSHA256(eventString, this.encryptionKey).toString();
  }

  // Event imzasını doğrula
  private verifyEvent(event: SecureEvent): boolean {
    const eventWithoutSignature = {
      id: event.id,
      type: event.type,
      data: event.data,
      timestamp: event.timestamp,
      module: event.module,
    };

    const expectedSignature = this.signEvent(eventWithoutSignature);
    return expectedSignature === event.signature;
  }

  // Event ID oluştur
  private generateEventId(): string {
    return CryptoJS.lib.WordArray.random(16).toString();
  }
}

// Global event bus instance
const eventBus = new SecureEventBus(
  "main-app",
  "microfrontend-secure-key-2024"
);

export default eventBus;
