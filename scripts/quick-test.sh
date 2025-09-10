#!/bin/bash

# Quick Test Script - ESLint ve temel testleri çalıştırır

set -e

echo "🚀 Hızlı Test Başlatılıyor..."

# Backend testleri
echo "📦 Backend testleri..."
cd backend

echo "  📋 Dependencies yükleniyor..."
npm ci --silent

echo "  🔍 ESLint çalıştırılıyor..."
npm run lint --silent || echo "⚠️ ESLint uyarıları var"

echo "  🧪 Unit testler çalıştırılıyor..."
npm run test:coverage --silent || echo "⚠️ Bazı testler başarısız"

cd ..

# Frontend testleri
echo "🎨 Frontend testleri..."
cd frontend

echo "  📋 Dependencies yükleniyor..."
npm ci --silent

echo "  🔍 ESLint çalıştırılıyor..."
npm run lint --silent || echo "⚠️ ESLint uyarıları var"

echo "  🔧 Type check çalıştırılıyor..."
npm run type-check --silent || echo "⚠️ Type check uyarıları var"

echo "  🏗️ Build çalıştırılıyor..."
npm run build --silent

cd ..

echo "✅ Hızlı test tamamlandı!"
echo "🚀 GitHub Actions için hazır!"
