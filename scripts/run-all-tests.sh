#!/bin/bash

# Comprehensive Test Runner
# Bu script tüm sistem testlerini çalıştırır

set -e

echo "🚀 Kapsamlı Sistem Testleri Başlatılıyor..."
echo "=============================================="

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test sayacı
passed_tests=0
total_tests=0

# Test fonksiyonu
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "\n${BLUE}🧪 Test: $test_name${NC}"
    echo "----------------------------------------"
    
    total_tests=$((total_tests + 1))
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ $test_name başarılı${NC}"
        passed_tests=$((passed_tests + 1))
        return 0
    else
        echo -e "${RED}❌ $test_name başarısız${NC}"
        return 1
    fi
}

# 1. mTLS Testleri
echo -e "\n${YELLOW}🔐 mTLS Testleri${NC}"
echo "=================="

run_test "mTLS Certificate Generation" "cd infra/certs && chmod +x generate-certs.sh && ./generate-certs.sh"
run_test "mTLS Configuration Check" "cd backend && node -e \"const mTLS = require('./config/mtls'); console.log('mTLS Status:', mTLS.getCertificateStatus());\""

# 2. RLS Testleri
echo -e "\n${YELLOW}🗄️ Supabase RLS Testleri${NC}"
echo "=========================="

run_test "RLS Policy Test" "cd backend && node scripts/test-rls.js"
run_test "RLS Database Apply" "cd backend && npm run db:apply"

# 3. Key Management Testleri
echo -e "\n${YELLOW}🔑 Key Management Testleri${NC}"
echo "============================="

run_test "Key Rotation Test" "cd backend && npm run rotate-key"
run_test "Key Store Check" "cd backend && node -e \"const keyManager = require('./config/keyStore'); console.log('Key Stats:', keyManager.getKeyStats());\""

# 4. Security Headers Testleri
echo -e "\n${YELLOW}🛡️ Security Headers Testleri${NC}"
echo "==============================="

run_test "Security Headers Check" "cd backend && node -e \"const headers = require('./middleware/securityHeaders'); console.log('Security headers middleware loaded');\""

# 5. Metrics Testleri
echo -e "\n${YELLOW}📊 Metrics Testleri${NC}"
echo "====================="

run_test "Metrics Service Check" "cd backend && node -e \"const metrics = require('./services/metricsService'); console.log('Metrics service loaded');\""
run_test "Prometheus Config Check" "yamllint infra/prometheus/prometheus.yml"

# 6. CI/CD Testleri
echo -e "\n${YELLOW}🔄 CI/CD Testleri${NC}"
echo "=================="

run_test "Frontend Workflow Check" "yamllint .github/workflows/frontend.yml"
run_test "Backend Workflow Check" "yamllint .github/workflows/backend.yml"
run_test "Security Workflow Check" "yamllint .github/workflows/security.yml"

# 7. Docker Testleri
echo -e "\n${YELLOW}🐳 Docker Testleri${NC}"
echo "=================="

run_test "Docker Compose Config" "docker-compose -f docker-compose.mtls.yml config"
run_test "Docker Build Test" "docker-compose -f docker-compose.mtls.yml build --no-cache"

# 8. Frontend Testleri
echo -e "\n${YELLOW}🎨 Frontend Testleri${NC}"
echo "====================="

run_test "Frontend Dependencies" "cd frontend && npm ci --silent"
run_test "Frontend Build" "cd frontend && npm run build --silent"

# 9. Backend Testleri
echo -e "\n${YELLOW}⚙️ Backend Testleri${NC}"
echo "===================="

run_test "Backend Dependencies" "cd backend && npm ci --silent"
run_test "Backend Lint" "cd backend && npm run lint --silent"

# 10. Integration Testleri
echo -e "\n${YELLOW}🔗 Integration Testleri${NC}"
echo "========================="

run_test "Event Bus Test" "cd frontend && node -e \"const eventBus = require('./src/modules/events/secureEventBus'); console.log('Event bus loaded');\""
run_test "Audit Logger Test" "cd backend && node -e \"const audit = require('./services/auditLogger'); console.log('Audit logger loaded');\""

# Test sonuçları
echo -e "\n${YELLOW}📊 Test Sonuçları${NC}"
echo "=================="
echo -e "Toplam Test: $total_tests"
echo -e "Geçen Test: $passed_tests"
echo -e "Başarısız Test: $((total_tests - passed_tests))"
echo -e "Başarı Oranı: $((passed_tests * 100 / total_tests))%"

if [ $passed_tests -eq $total_tests ]; then
    echo -e "\n${GREEN}🎉 Tüm testler başarılı!${NC}"
    echo -e "${GREEN}✅ Sistem production-ready${NC}"
    echo -e "${GREEN}🚀 Deployment için hazır${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️ Bazı testler başarısız${NC}"
    echo -e "${RED}🔧 Hataları düzeltin ve tekrar test edin${NC}"
    exit 1
fi
