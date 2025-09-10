# Frontend - Mikrofrontend Sistemi

React ve TypeScript ile geliştirilmiş şifreli haberleşen mikrofrontend uygulaması.

## 🚀 Özellikler

- **React 18** modern UI framework
- **TypeScript** tip güvenliği
- **Redux Toolkit** durum yönetimi
- **Styled Components** CSS-in-JS
- **Vite** hızlı build tool
- **Şifreli İletişim** backend ile güvenli haberleşme
- **Responsive Tasarım** mobil uyumlu
- **Dark/Light Tema** tema değiştirme

## 📦 Bağımlılıklar

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.8.1",
  "axios": "^1.6.2",
  "crypto-js": "^4.2.0",
  "@reduxjs/toolkit": "^1.9.7",
  "react-redux": "^8.1.3",
  "styled-components": "^6.1.1",
  "react-hot-toast": "^2.4.1",
  "react-icons": "^4.12.0"
}
```

## 🛠️ Kurulum

1. Bağımlılıkları yükleyin:

```bash
npm install
```

2. Geliştirme sunucusunu başlatın:

```bash
npm run dev
```

3. Build alın:

```bash
npm run build
```

4. Preview:

```bash
npm run preview
```

## 🎨 Tema Sistemi

### Light Theme

- Açık renk paleti
- Yüksek kontrast
- Modern tasarım

### Dark Theme

- Koyu renk paleti
- Göz yormayan renkler
- Gece modu uyumlu

## 🔐 Güvenlik

### Şifreleme

- **CryptoJS** ile AES şifreleme
- **JWT** token yönetimi
- **Axios interceptors** otomatik şifreleme
- **Veri bütünlüğü** kontrolü

### API İletişimi

- Otomatik token ekleme
- Şifreli veri gönderme/alma
- Hata yönetimi
- Loading states

## 📱 Mikrofrontend Modülleri

### 1. Dashboard Modülü

- Sistem genel bakış
- Modül durumları
- İstatistikler
- Hızlı erişim

### 2. Kimlik Doğrulama Modülü

- Giriş formu
- Kayıt formu
- Token yönetimi
- Güvenli çıkış

### 3. Şifreleme Test Modülü

- Yerel şifreleme testi
- Sunucu şifreleme testi
- Veri bütünlüğü kontrolü
- Sonuç görüntüleme

### 4. Sistem Bilgileri Modülü

- Modül listesi
- Sistem durumu
- API health check
- Performans metrikleri

## 🏗️ Mimari

### Redux Store

```typescript
{
  auth: {
    user: User | null,
    token: string | null,
    isAuthenticated: boolean,
    isLoading: boolean,
    error: string | null
  },
  ui: {
    theme: 'light' | 'dark',
    sidebarOpen: boolean,
    loading: boolean,
    notifications: Notification[],
    currentModule: string | null
  }
}
```

### API Service

- Axios tabanlı HTTP client
- Otomatik şifreleme/çözme
- Token yönetimi
- Hata handling
- Loading states

### Component Yapısı

```
src/
├── components/
│   ├── Auth/           # Kimlik doğrulama
│   ├── Layout/         # Layout bileşenleri
│   └── Modules/        # Mikrofrontend modülleri
├── services/
│   └── api.ts         # API servis katmanı
├── store/
│   ├── slices/        # Redux slice'ları
│   └── store.ts       # Store konfigürasyonu
├── theme/
│   └── theme.ts       # Tema tanımları
├── utils/
│   └── encryption.ts  # Şifreleme araçları
└── App.tsx           # Ana uygulama
```

## 🎯 Kullanım

### Giriş Yapma

1. `http://localhost:3000` adresine gidin
2. Test kullanıcıları ile giriş yapın:
   - Admin: `admin` / `password`
   - User: `user` / `password`

### Modül Kullanımı

1. Sidebar'dan modül seçin
2. Dashboard'da sistem genel bakışı görün
3. Şifreleme testi ile güvenlik testleri yapın
4. Tema değiştirme ile görsel deneyimi özelleştirin

## 🔧 Geliştirme

### Scripts

```bash
npm run dev      # Geliştirme sunucusu
npm run build    # Production build
npm run preview  # Build preview
npm run lint     # ESLint kontrolü
```

### TypeScript

- Strict mode aktif
- Tip güvenliği
- Interface tanımları
- Generic types

### Styled Components

- Theme provider
- Responsive design
- CSS-in-JS
- Dynamic styling

## 📊 Performans

- **Vite** hızlı build
- **Code splitting** lazy loading
- **Tree shaking** optimize bundle
- **Hot reload** hızlı geliştirme
- **TypeScript** compile-time hata kontrolü

## 🚀 Deployment

### Build

```bash
npm run build
```

### Static Hosting

- Netlify
- Vercel
- GitHub Pages
- AWS S3

### Environment Variables

```env
VITE_API_URL=http://localhost:3001
VITE_ENCRYPTION_KEY=mikrofrontend_encryption_key_32_chars
```
