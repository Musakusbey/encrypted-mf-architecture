import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import encryption from "../utils/encryption";
import { store } from "../store/store";
import toast from "react-hot-toast";

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = "http://localhost:3001";
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - şifreleme ve token ekleme
    this.api.interceptors.request.use(
      config => {
        const state = store.getState();
        const token = state.auth.token;

        // Token varsa header'a ekle
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Şifreleme geçici olarak devre dışı
        // if ((config.method === "post" || config.method === "put") &&
        //     (config.url?.includes('/auth/') || config.url?.includes('/api/'))) {
        //   if (config.data && typeof config.data === "object") {
        //     try {
        //       const encryptedData = encryption.encrypt(config.data);
        //       config.data = encryptedData;
        //     } catch (error) {
        //       console.error("İstek şifreleme hatası:", error);
        //     }
        //   }
        // }

        return config;
      },
      error => {
        console.error("Request interceptor hatası:", error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - şifre çözme ve hata yönetimi
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        // Şifreleme geçici olarak devre dışı
        // if (response.data && response.data.encrypted) {
        //   try {
        //     response.data = encryption.decrypt(response.data);
        //   } catch (error) {
        //     console.error("Yanıt şifre çözme hatası:", error);
        //   }
        // }

        return response;
      },
      error => {
        console.error("Response interceptor hatası:", error);

        if (error.response?.status === 401) {
          // Token süresi dolmuş, çıkış yap
          store.dispatch({ type: "auth/logout" });
          toast.error("Oturum süresi doldu, lütfen tekrar giriş yapın");
        } else if (error.response?.status === 403) {
          toast.error("Bu işlem için yetkiniz bulunmuyor");
        } else if (error.response?.status >= 500) {
          toast.error("Sunucu hatası, lütfen daha sonra tekrar deneyin");
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: { username: string; password: string }) {
    const response = await this.api.post("/auth/login", credentials);
    return response.data;
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
  }) {
    const response = await this.api.post("/auth/register", userData);
    return response.data;
  }

  async verifyToken() {
    const response = await this.api.get("/auth/verify");
    return response.data;
  }

  // API endpoints
  async getProfile() {
    const response = await this.api.get("/api/profile");
    return response.data;
  }

  async sendSecureData(data: any, type?: string) {
    const response = await this.api.post("/api/secure-data", { data, type });
    return response.data;
  }

  async getModules() {
    const response = await this.api.get("/api/modules");
    return response.data;
  }

  async getHealth() {
    const response = await this.api.get("/api/health");
    return response.data;
  }

  async testEncryption(testData: any) {
    const response = await this.api.post("/api/encryption-test", { testData });
    return response.data;
  }

  // Genel HTTP metodları
  async get(url: string, config?: AxiosRequestConfig) {
    const response = await this.api.get(url, config);
    return response.data;
  }

  async post(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.api.post(url, data, config);
    return response.data;
  }

  async put(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.api.put(url, data, config);
    return response.data;
  }

  async delete(url: string, config?: AxiosRequestConfig) {
    const response = await this.api.delete(url, config);
    return response.data;
  }
}

export default new ApiService();
