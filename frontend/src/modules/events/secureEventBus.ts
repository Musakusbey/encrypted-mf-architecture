import CryptoJS from "crypto-js";

interface EventMessage {
  type: string;
  version: string;
  payload: any;
  ts: number;
  sig: string;
}

interface EventListener {
  (payload: any): void;
}

class SecureEventBus {
  private listeners: Map<string, EventListener[]> = new Map();
  private schemas: Map<string, any> = new Map();
  private allowedOrigins: string[] = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "https://yourdomain.com",
  ];
  private secret: string;

  constructor() {
    this.secret =
      process.env.REACT_APP_EVENT_BUS_SECRET || "default-event-bus-secret";
    this.loadSchemas();
  }

  private loadSchemas() {
    // Schema'ları yükle (gerçek uygulamada API'den yüklenebilir)
    this.schemas.set("userEvent", {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: [
            "user.login",
            "user.logout",
            "user.created",
            "user.updated",
            "user.deleted",
          ],
        },
        version: { type: "string", pattern: "^\\d+\\.\\d+$" },
        payload: {
          type: "object",
          properties: {
            userId: { type: "string", format: "uuid" },
            username: { type: "string", minLength: 1 },
            email: { type: "string", format: "email" },
            timestamp: { type: "number" },
          },
          required: ["userId", "timestamp"],
        },
        ts: { type: "number" },
        sig: { type: "string", minLength: 64 },
      },
      required: ["type", "version", "payload", "ts", "sig"],
    });

    this.schemas.set("securityEvent", {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: [
            "security.key.rotated",
            "security.cert.expired",
            "security.audit.log",
            "security.replay.blocked",
          ],
        },
        version: { type: "string", pattern: "^\\d+\\.\\d+$" },
        payload: {
          type: "object",
          properties: {
            eventType: { type: "string" },
            severity: {
              type: "string",
              enum: ["low", "medium", "high", "critical"],
            },
            details: { type: "object" },
            timestamp: { type: "number" },
          },
          required: ["eventType", "severity", "timestamp"],
        },
        ts: { type: "number" },
        sig: { type: "string", minLength: 64 },
      },
      required: ["type", "version", "payload", "ts", "sig"],
    });
  }

  private validateSchema(eventType: string, message: EventMessage): boolean {
    const schema = this.schemas.get(eventType);
    if (!schema) {
      console.warn(`🔒 Güvenlik Uyarısı: Bilinmeyen event type: ${eventType}`);
      return false;
    }

    // Basit schema validasyonu (gerçek uygulamada ajv gibi kütüphane kullanılabilir)
    const requiredFields = schema.required || [];
    for (const field of requiredFields) {
      if (!(field in message)) {
        console.warn(`🔒 Güvenlik Uyarısı: Gerekli alan eksik: ${field}`);
        return false;
      }
    }

    return true;
  }

  private createSignature(data: string): string {
    return CryptoJS.HmacSHA256(data, this.secret).toString();
  }

  private verifySignature(data: string, signature: string): boolean {
    const expectedSignature = this.createSignature(data);
    return expectedSignature === signature;
  }

  private validateOrigin(origin: string): boolean {
    return this.allowedOrigins.includes(origin);
  }

  public publish(
    eventType: string,
    version: string,
    payload: any,
    targetOrigin?: string
  ) {
    try {
      const timestamp = Date.now();
      const message: EventMessage = {
        type: eventType,
        version,
        payload,
        ts: timestamp,
        sig: "",
      };

      // İmza oluştur
      const dataToSign = `${eventType}@${version}.${JSON.stringify(
        payload
      )}.${timestamp}`;
      message.sig = this.createSignature(dataToSign);

      // Schema validasyonu
      if (!this.validateSchema(eventType, message)) {
        console.warn(
          `🔒 Güvenlik Uyarısı: Event schema validasyonu başarısız: ${eventType}`
        );
        return;
      }

      // PostMessage ile gönder (eğer targetOrigin belirtilmişse)
      if (targetOrigin && this.validateOrigin(targetOrigin)) {
        window.postMessage(
          {
            type: "SECURE_EVENT",
            data: message,
          },
          targetOrigin
        );
      }

      // Local listener'lara gönder
      this.dispatchLocal(eventType, message);

      console.log(`🔐 Event published: ${eventType}@${version}`);
    } catch (error) {
      console.error("Event publish error:", error);
    }
  }

  public subscribe(eventType: string, listener: EventListener) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(listener);
    console.log(`🔓 Subscribed to: ${eventType}`);
  }

  public unsubscribe(eventType: string, listener: EventListener) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
        console.log(`🔓 Unsubscribed from: ${eventType}`);
      }
    }
  }

  private dispatchLocal(eventType: string, message: EventMessage) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(message.payload);
        } catch (error) {
          console.error("Event listener error:", error);
        }
      });
    }
  }

  public handleMessage(event: MessageEvent) {
    try {
      if (event.data?.type === "SECURE_EVENT") {
        const message: EventMessage = event.data.data;

        // Origin kontrolü
        if (!this.validateOrigin(event.origin)) {
          console.warn(
            `🔒 Güvenlik Uyarısı: İzin verilmeyen origin: ${event.origin}`
          );
          return;
        }

        // İmza doğrulama
        const dataToSign = `${message.type}@${message.version}.${JSON.stringify(
          message.payload
        )}.${message.ts}`;
        if (!this.verifySignature(dataToSign, message.sig)) {
          console.warn(`🔒 Güvenlik Uyarısı: Geçersiz imza: ${message.type}`);
          return;
        }

        // Schema validasyonu
        if (!this.validateSchema(message.type, message)) {
          console.warn(
            `🔒 Güvenlik Uyarısı: Schema validasyonu başarısız: ${message.type}`
          );
          return;
        }

        // Timestamp kontrolü (5 dakika tolerans)
        const now = Date.now();
        if (Math.abs(now - message.ts) > 5 * 60 * 1000) {
          console.warn(`🔒 Güvenlik Uyarısı: Eski timestamp: ${message.type}`);
          return;
        }

        // Event'i işle
        this.dispatchLocal(message.type, message);
        console.log(`🔓 Event received: ${message.type}@${message.version}`);
      }
    } catch (error) {
      console.error("Message handling error:", error);
    }
  }
}

// Global instance
const secureEventBus = new SecureEventBus();

// Window message listener'ı ekle
if (typeof window !== "undefined") {
  window.addEventListener("message", event => {
    secureEventBus.handleMessage(event);
  });
}

export default secureEventBus;
