import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  Shield,
  Lock,
  Key,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
} from "lucide-react";
import eventBus from "../../services/eventBus";

const Container = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  margin: 0;
  font-size: 1.125rem;
`;

const SecurityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const SecurityCard = styled.div<{ status: "secure" | "warning" | "danger" }>`
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 1rem;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => {
      switch (props.status) {
        case "secure":
          return "#10b981";
        case "warning":
          return "#f59e0b";
        case "danger":
          return "#ef4444";
        default:
          return "#6b7280";
      }
    }};
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const CardTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatusBadge = styled.span<{ status: "secure" | "warning" | "danger" }>`
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 0.25rem;

  ${props => {
    switch (props.status) {
      case "secure":
        return `
          background: #dcfce7;
          color: #16a34a;
        `;
      case "warning":
        return `
          background: #fef3c7;
          color: #d97706;
        `;
      case "danger":
        return `
          background: #fecaca;
          color: #dc2626;
        `;
    }
  }}
`;

const Metric = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid ${props => props.theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const MetricLabel = styled.span`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.875rem;
`;

const MetricValue = styled.span`
  color: ${props => props.theme.colors.text};
  font-weight: 600;
  font-size: 0.875rem;
`;

const EventLog = styled.div`
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const LogTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LogEntry = styled.div<{ type: "info" | "warning" | "error" | "success" }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid ${props => props.theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const LogIcon = styled.div<{ type: "info" | "warning" | "error" | "success" }>`
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  ${props => {
    switch (props.type) {
      case "info":
        return `
          background: #dbeafe;
          color: #2563eb;
        `;
      case "warning":
        return `
          background: #fef3c7;
          color: #d97706;
        `;
      case "error":
        return `
          background: #fecaca;
          color: #dc2626;
        `;
      case "success":
        return `
          background: #dcfce7;
          color: #16a34a;
        `;
    }
  }}
`;

const LogContent = styled.div`
  flex: 1;
`;

const LogMessage = styled.div`
  color: ${props => props.theme.colors.text};
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
`;

const LogTime = styled.div`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.75rem;
`;

const ActionButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 0.5rem;
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;

  &:hover {
    background: ${props => props.theme.colors.primary};
    color: white;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const SecurityDashboard: React.FC = () => {
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [keyStats, setKeyStats] = useState({
    activeKeys: 0,
    totalHistory: 0,
    lastRotation: null,
  });
  const [certStats, setCertStats] = useState({
    totalCerts: 0,
    validCerts: 0,
    expiredCerts: 0,
  });

  useEffect(() => {
    // Event bus'a abone ol
    eventBus.subscribe("security-event", data => {
      setSecurityEvents(prev => [data, ...prev.slice(0, 49)]); // Son 50 event
    });

    // Mock data yükle
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    // Mock security events
    const mockEvents = [
      {
        id: "1",
        type: "success",
        message: "Kullanıcı başarıyla giriş yaptı",
        time: "11:25:30",
        module: "auth",
      },
      {
        id: "2",
        type: "warning",
        message: "Yüksek CPU kullanımı tespit edildi",
        time: "11:20:15",
        module: "system",
      },
      {
        id: "3",
        type: "error",
        message: "Geçersiz API isteği reddedildi",
        time: "11:15:45",
        module: "api",
      },
      {
        id: "4",
        type: "info",
        message: "Anahtar rotasyonu tamamlandı",
        time: "11:10:00",
        module: "security",
      },
    ];

    setSecurityEvents(mockEvents);
    setKeyStats({
      activeKeys: 3,
      totalHistory: 12,
      lastRotation: "2025-09-10 11:10:00",
    });
    setCertStats({
      totalCerts: 4,
      validCerts: 3,
      expiredCerts: 1,
    });
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle size={12} />;
      case "warning":
        return <AlertTriangle size={12} />;
      case "error":
        return <AlertTriangle size={12} />;
      default:
        return <Activity size={12} />;
    }
  };

  return (
    <Container>
      <Header>
        <Title>
          <Shield size={32} />
          Güvenlik Merkezi
        </Title>
        <Subtitle>Sistem güvenliğini izleyin ve yönetin</Subtitle>
      </Header>

      <SecurityGrid>
        <SecurityCard status="secure">
          <CardHeader>
            <CardTitle>
              <Key size={20} />
              Anahtar Yönetimi
            </CardTitle>
            <StatusBadge status="secure">
              <CheckCircle size={12} />
              Güvenli
            </StatusBadge>
          </CardHeader>
          <Metric>
            <MetricLabel>Aktif Anahtarlar</MetricLabel>
            <MetricValue>{keyStats.activeKeys}</MetricValue>
          </Metric>
          <Metric>
            <MetricLabel>Toplam Geçmiş</MetricLabel>
            <MetricValue>{keyStats.totalHistory}</MetricValue>
          </Metric>
          <Metric>
            <MetricLabel>Son Rotasyon</MetricLabel>
            <MetricValue>{keyStats.lastRotation || "Bilinmiyor"}</MetricValue>
          </Metric>
        </SecurityCard>

        <SecurityCard status="warning">
          <CardHeader>
            <CardTitle>
              <Lock size={20} />
              Sertifikalar
            </CardTitle>
            <StatusBadge status="warning">
              <AlertTriangle size={12} />
              Uyarı
            </StatusBadge>
          </CardHeader>
          <Metric>
            <MetricLabel>Toplam Sertifika</MetricLabel>
            <MetricValue>{certStats.totalCerts}</MetricValue>
          </Metric>
          <Metric>
            <MetricLabel>Geçerli</MetricLabel>
            <MetricValue style={{ color: "#10b981" }}>
              {certStats.validCerts}
            </MetricValue>
          </Metric>
          <Metric>
            <MetricLabel>Süresi Dolmuş</MetricLabel>
            <MetricValue style={{ color: "#ef4444" }}>
              {certStats.expiredCerts}
            </MetricValue>
          </Metric>
        </SecurityCard>

        <SecurityCard status="secure">
          <CardHeader>
            <CardTitle>
              <FileText size={20} />
              Audit Logları
            </CardTitle>
            <StatusBadge status="secure">
              <CheckCircle size={12} />
              Aktif
            </StatusBadge>
          </CardHeader>
          <Metric>
            <MetricLabel>Bugünkü Loglar</MetricLabel>
            <MetricValue>{securityEvents.length}</MetricValue>
          </Metric>
          <Metric>
            <MetricLabel>Güvenlik Olayları</MetricLabel>
            <MetricValue>
              {
                securityEvents.filter(
                  e => e.type === "error" || e.type === "warning"
                ).length
              }
            </MetricValue>
          </Metric>
          <Metric>
            <MetricLabel>Son Güncelleme</MetricLabel>
            <MetricValue>Şimdi</MetricValue>
          </Metric>
        </SecurityCard>

        <SecurityCard status="secure">
          <CardHeader>
            <CardTitle>
              <Shield size={20} />
              RLS Politikaları
            </CardTitle>
            <StatusBadge status="secure">
              <CheckCircle size={12} />
              Aktif
            </StatusBadge>
          </CardHeader>
          <Metric>
            <MetricLabel>Korunan Tablolar</MetricLabel>
            <MetricValue>4</MetricValue>
          </Metric>
          <Metric>
            <MetricLabel>Aktif Politikalar</MetricLabel>
            <MetricValue>12</MetricValue>
          </Metric>
          <Metric>
            <MetricLabel>Son Kontrol</MetricLabel>
            <MetricValue>Şimdi</MetricValue>
          </Metric>
        </SecurityCard>
      </SecurityGrid>

      <EventLog>
        <LogTitle>
          <Activity size={20} />
          Güvenlik Olayları
        </LogTitle>
        {securityEvents.map(event => (
          <LogEntry key={event.id} type={event.type}>
            <LogIcon type={event.type}>{getEventIcon(event.type)}</LogIcon>
            <LogContent>
              <LogMessage>{event.message}</LogMessage>
              <LogTime>
                {event.time} - {event.module}
              </LogTime>
            </LogContent>
            <ActionButton>
              <Eye size={12} />
              Detay
            </ActionButton>
          </LogEntry>
        ))}
      </EventLog>

      <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
        <ActionButton>
          <RefreshCw size={16} />
          Yenile
        </ActionButton>
        <ActionButton>
          <Download size={16} />
          Rapor İndir
        </ActionButton>
      </div>
    </Container>
  );
};

export default SecurityDashboard;
