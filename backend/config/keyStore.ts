import crypto from "crypto";
import fs from "fs";
import path from "path";

interface KeyMaterial {
  id: string;
  material: string;
  createdAt: number;
}

interface KeyStore {
  activeKeyId: string;
  keys: { [keyId: string]: KeyMaterial };
}

const KEY_STORE_PATH = path.join(__dirname, "../.keys/keyStore.json");

class KeyManager {
  private keyStore: KeyStore;

  constructor() {
    this.keyStore = this.loadKeyStore();
    if (
      !this.keyStore.activeKeyId ||
      !this.keyStore.keys[this.keyStore.activeKeyId]
    ) {
      this.generateNewKey();
    }
  }

  private loadKeyStore(): KeyStore {
    try {
      if (fs.existsSync(KEY_STORE_PATH)) {
        const data = fs.readFileSync(KEY_STORE_PATH, "utf8");
        return JSON.parse(data);
      }
    } catch (error) {
      console.error("Key store yüklenirken hata:", error);
    }

    return {
      activeKeyId: "",
      keys: {},
    };
  }

  private saveKeyStore(): void {
    try {
      const dir = path.dirname(KEY_STORE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(KEY_STORE_PATH, JSON.stringify(this.keyStore, null, 2));
    } catch (error) {
      console.error("Key store kaydedilirken hata:", error);
    }
  }

  private generateNewKey(): string {
    const keyId = crypto.randomUUID();
    const material = crypto.randomBytes(32).toString("hex"); // 256-bit key

    this.keyStore.keys[keyId] = {
      id: keyId,
      material,
      createdAt: Date.now(),
    };

    this.keyStore.activeKeyId = keyId;
    this.saveKeyStore();

    console.log(`Yeni anahtar oluşturuldu: ${keyId}`);
    return keyId;
  }

  public getActiveKey(): string {
    const activeKey = this.keyStore.keys[this.keyStore.activeKeyId];
    if (!activeKey) {
      throw new Error("Aktif anahtar bulunamadı");
    }
    return activeKey.material;
  }

  public getKey(keyId: string): string | null {
    const key = this.keyStore.keys[keyId];
    return key ? key.material : null;
  }

  public rotateKey(): string {
    const newKeyId = this.generateNewKey();
    console.log(
      `Anahtar rotasyonu tamamlandı. Yeni aktif anahtar: ${newKeyId}`
    );
    return newKeyId;
  }

  public getKeyStats() {
    const activeKey = this.keyStore.keys[this.keyStore.activeKeyId];
    const keyHistory = Object.values(this.keyStore.keys);

    return {
      activeKeyId: this.keyStore.activeKeyId,
      activeKeyCreatedAt: activeKey?.createdAt || 0,
      totalKeys: keyHistory.length,
      lastRotation: activeKey?.createdAt || 0,
      keyHistory: keyHistory.sort((a, b) => b.createdAt - a.createdAt),
    };
  }

  public getKeysForDecryption(): { [keyId: string]: string } {
    // Son 2 anahtarı döndür (dual-decrypt dönemi)
    const keyHistory = Object.values(this.keyStore.keys)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 2);

    const keys: { [keyId: string]: string } = {};
    keyHistory.forEach(key => {
      keys[key.id] = key.material;
    });

    return keys;
  }
}

export default new KeyManager();
