#!/bin/bash

# CI/CD Pipeline Test Script
# Bu script GitHub Actions workflow'larını test eder

set -e

echo "🚀 CI/CD Pipeline Testleri Başlatılıyor..."

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test fonksiyonu
test_step() {
    local step_name="$1"
    local command="$2"
    
    echo -e "${YELLOW}📋 Test: $step_name${NC}"
    
    if eval "$command"; then
        echo -e "${GREEN}✅ $step_name başarılı${NC}"
        return 0
    else
        echo -e "${RED}❌ $step_name başarısız${NC}"
        return 1
    fi
}

# Test sayacı
passed_tests=0
total_tests=0

# Frontend Tests
echo -e "\n${YELLOW}🎨 Frontend Testleri${NC}"
echo "================================"

# Frontend dependency check
total_tests=$((total_tests + 1))
if test_step "Frontend Dependencies" "cd frontend && npm ci --silent"; then
    passed_tests=$((passed_tests + 1))
fi

# Frontend lint check
total_tests=$((total_tests + 1))
if test_step "Frontend Lint" "cd frontend && npm run lint --silent"; then
    passed_tests=$((passed_tests + 1))
fi

# Frontend type check
total_tests=$((total_tests + 1))
if test_step "Frontend Type Check" "cd frontend && npm run type-check --silent"; then
    passed_tests=$((passed_tests + 1))
fi

# Frontend build
total_tests=$((total_tests + 1))
if test_step "Frontend Build" "cd frontend && npm run build --silent"; then
    passed_tests=$((passed_tests + 1))
fi

# Frontend security audit
total_tests=$((total_tests + 1))
if test_step "Frontend Security Audit" "cd frontend && npm audit --audit-level moderate --silent"; then
    passed_tests=$((passed_tests + 1))
fi

# Backend Tests
echo -e "\n${YELLOW}⚙️ Backend Testleri${NC}"
echo "================================"

# Backend dependency check
total_tests=$((total_tests + 1))
if test_step "Backend Dependencies" "cd backend && npm ci --silent"; then
    passed_tests=$((passed_tests + 1))
fi

# Backend lint check
total_tests=$((total_tests + 1))
if test_step "Backend Lint" "cd backend && npm run lint --silent"; then
    passed_tests=$((passed_tests + 1))
fi

# Backend unit tests
total_tests=$((total_tests + 1))
if test_step "Backend Unit Tests" "cd backend && npm run test:coverage --silent"; then
    passed_tests=$((passed_tests + 1))
fi

# Backend security audit
total_tests=$((total_tests + 1))
if test_step "Backend Security Audit" "cd backend && npm audit --audit-level moderate --silent"; then
    passed_tests=$((passed_tests + 1))
fi

# Security Tests
echo -e "\n${YELLOW}🔒 Güvenlik Testleri${NC}"
echo "================================"

# RLS test
total_tests=$((total_tests + 1))
if test_step "Supabase RLS Test" "cd backend && node scripts/test-rls.js"; then
    passed_tests=$((passed_tests + 1))
fi

# Key rotation test
total_tests=$((total_tests + 1))
if test_step "Key Rotation Test" "cd backend && npm run rotate-key"; then
    passed_tests=$((passed_tests + 1))
fi

# mTLS certificate test
total_tests=$((total_tests + 1))
if test_step "mTLS Certificate Test" "cd infra/certs && chmod +x generate-certs.sh && ./generate-certs.sh"; then
    passed_tests=$((passed_tests + 1))
fi

# Docker Tests
echo -e "\n${YELLOW}🐳 Docker Testleri${NC}"
echo "================================"

# Docker build test
total_tests=$((total_tests + 1))
if test_step "Docker Build Test" "docker-compose -f docker-compose.mtls.yml build --no-cache"; then
    passed_tests=$((passed_tests + 1))
fi

# Docker compose test
total_tests=$((total_tests + 1))
if test_step "Docker Compose Test" "docker-compose -f docker-compose.mtls.yml config"; then
    passed_tests=$((passed_tests + 1))
fi

# GitHub Actions Workflow Tests
echo -e "\n${YELLOW}🔄 GitHub Actions Testleri${NC}"
echo "================================"

# Frontend workflow syntax
total_tests=$((total_tests + 1))
if test_step "Frontend Workflow Syntax" "yamllint .github/workflows/frontend.yml"; then
    passed_tests=$((passed_tests + 1))
fi

# Backend workflow syntax
total_tests=$((total_tests + 1))
if test_step "Backend Workflow Syntax" "yamllint .github/workflows/backend.yml"; then
    passed_tests=$((passed_tests + 1))
fi

# Security workflow syntax
total_tests=$((total_tests + 1))
if test_step "Security Workflow Syntax" "yamllint .github/workflows/security.yml"; then
    passed_tests=$((passed_tests + 1))
fi

# Test sonuçları
echo -e "\n${YELLOW}📊 Test Sonuçları${NC}"
echo "================================"
echo -e "Toplam Test: $total_tests"
echo -e "Geçen Test: $passed_tests"
echo -e "Başarısız Test: $((total_tests - passed_tests))"
echo -e "Başarı Oranı: $((passed_tests * 100 / total_tests))%"

if [ $passed_tests -eq $total_tests ]; then
    echo -e "\n${GREEN}🎉 Tüm CI/CD testleri başarılı!${NC}"
    echo -e "${GREEN}✅ Pipeline production-ready${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️ Bazı CI/CD testleri başarısız${NC}"
    echo -e "${RED}🔧 Hataları düzeltin ve tekrar test edin${NC}"
    exit 1
fi
