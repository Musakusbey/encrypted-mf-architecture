#!/bin/bash

# mTLS Certificate Generation Script
# Bu script development ortamı için self-signed sertifikalar oluşturur

set -e

CERT_DIR="$(dirname "$0")"
CA_KEY="$CERT_DIR/ca.key"
CA_CERT="$CERT_DIR/ca.crt"
SERVER_KEY="$CERT_DIR/server.key"
SERVER_CERT="$CERT_DIR/server.crt"
CLIENT_KEY="$CERT_DIR/client.key"
CLIENT_CERT="$CERT_DIR/client.crt"

echo "🔐 mTLS Sertifikaları oluşturuluyor..."

# CA Private Key oluştur
openssl genrsa -out "$CA_KEY" 4096

# CA Certificate oluştur
openssl req -new -x509 -days 365 -key "$CA_KEY" -out "$CA_CERT" -subj "/C=TR/ST=Istanbul/L=Istanbul/O=Microfrontend/OU=CA/CN=Microfrontend-CA"

# Server Private Key oluştur
openssl genrsa -out "$SERVER_KEY" 2048

# Server Certificate Request oluştur
openssl req -new -key "$SERVER_KEY" -out "$CERT_DIR/server.csr" -subj "/C=TR/ST=Istanbul/L=Istanbul/O=Microfrontend/OU=Server/CN=localhost"

# Server Certificate oluştur
openssl x509 -req -days 365 -in "$CERT_DIR/server.csr" -CA "$CA_CERT" -CAkey "$CA_KEY" -CAcreateserial -out "$SERVER_CERT" -extensions v3_req -extfile <(
cat <<EOF
[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names
[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
EOF
)

# Client Private Key oluştur
openssl genrsa -out "$CLIENT_KEY" 2048

# Client Certificate Request oluştur
openssl req -new -key "$CLIENT_KEY" -out "$CERT_DIR/client.csr" -subj "/C=TR/ST=Istanbul/L=Istanbul/O=Microfrontend/OU=Client/CN=client"

# Client Certificate oluştur
openssl x509 -req -days 365 -in "$CERT_DIR/client.csr" -CA "$CA_CERT" -CAkey "$CA_KEY" -CAcreateserial -out "$CLIENT_CERT" -extensions v3_req -extfile <(
cat <<EOF
[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = clientAuth
EOF
)

# Geçici dosyaları temizle
rm -f "$CERT_DIR/server.csr" "$CERT_DIR/client.csr" "$CERT_DIR/ca.srl"

# İzinleri ayarla
chmod 600 "$CA_KEY" "$SERVER_KEY" "$CLIENT_KEY"
chmod 644 "$CA_CERT" "$SERVER_CERT" "$CLIENT_CERT"

echo "✅ mTLS sertifikaları başarıyla oluşturuldu!"
echo "📁 Sertifika dizini: $CERT_DIR"
echo ""
echo "📋 Sertifika bilgileri:"
echo "CA Certificate: $CA_CERT"
echo "Server Certificate: $SERVER_CERT"
echo "Server Private Key: $SERVER_KEY"
echo "Client Certificate: $CLIENT_CERT"
echo "Client Private Key: $CLIENT_KEY"
echo ""
echo "🔧 Kullanım:"
echo "Backend'de mTLS'i etkinleştirmek için server.js'de mTLS konfigürasyonunu ekleyin"
echo "Client'ta mTLS kullanmak için HTTPS isteklerinde sertifikaları belirtin"
