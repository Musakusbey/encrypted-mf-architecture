import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  Server,
  Database,
  Cpu,
  HardDrive,
  Network,
  Shield,
  Clock,
  Activity,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Monitor,
  Globe,
  Zap,
} from "lucide-react";

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const RefreshButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const Card = styled.div`
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 1rem;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
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

const StatusBadge = styled.span<{ status: "online" | "warning" | "error" }>`
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
      case "online":
        return `
          background: #dcfce7;
          color: #16a34a;
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

const ProgressBar = styled.div`
  width: 100%;
  height: 0.5rem;
  background: ${props => props.theme.colors.background};
  border-radius: 0.25rem;
  overflow: hidden;
  margin-top: 0.5rem;
`;

const ProgressFill = styled.div<{ percentage: number; color: string }>`
  height: 100%;
  width: ${props => props.percentage}%;
  background: ${props => props.color};
  border-radius: 0.25rem;
  transition: width 0.3s ease;
`;

const ChartContainer = styled.div`
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const ChartTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  height: 200px;
  align-items: end;
`;

const ChartBar = styled.div<{ height: number; color: string }>`
  background: ${props => props.color};
  border-radius: 0.25rem 0.25rem 0 0;
  height: ${props => props.height}%;
  min-height: 4px;
  transition: height 0.3s ease;
`;

const LogContainer = styled.div`
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 1rem;
  padding: 1.5rem;
  max-height: 400px;
  overflow-y: auto;
`;

const LogEntry = styled.div<{ type: "info" | "warning" | "error" }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid ${props => props.theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const LogIcon = styled.div<{ type: "info" | "warning" | "error" }>`
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

// Mock data
const systemData = {
  server: {
    status: "online" as const,
    uptime: "15 gün, 3 saat",
    version: "v2.1.4",
    lastRestart: "2025-08-26 14:30:00",
  },
  database: {
    status: "online" as const,
    connections: 45,
    maxConnections: 100,
    size: "2.3 GB",
    queries: 1250,
  },
  cpu: {
    usage: 35,
    cores: 8,
    temperature: 45,
    frequency: "3.2 GHz",
  },
  memory: {
    used: 6.2,
    total: 16,
    percentage: 38.75,
  },
  disk: {
    used: 45.6,
    total: 100,
    percentage: 45.6,
    free: "54.4 GB",
  },
  network: {
    incoming: "125.6 MB/s",
    outgoing: "89.3 MB/s",
    packets: 12500,
    errors: 0,
  },
};

const chartData = [
  { day: "Pzt", value: 65, color: "#667eea" },
  { day: "Sal", value: 45, color: "#764ba2" },
  { day: "Çar", value: 78, color: "#f093fb" },
  { day: "Per", value: 52, color: "#f5576c" },
  { day: "Cum", value: 89, color: "#4facfe" },
  { day: "Cmt", value: 34, color: "#00f2fe" },
  { day: "Paz", value: 67, color: "#667eea" },
];

const logEntries = [
  {
    type: "info" as const,
    message: "Sistem başarıyla başlatıldı",
    time: "10:30:15",
  },
  {
    type: "info" as const,
    message: "Veritabanı bağlantısı kuruldu",
    time: "10:30:16",
  },
  {
    type: "warning" as const,
    message: "Yüksek CPU kullanımı tespit edildi",
    time: "10:25:30",
  },
  {
    type: "info" as const,
    message: "Yeni kullanıcı kaydı: test@example.com",
    time: "10:20:45",
  },
  {
    type: "error" as const,
    message: "Geçersiz API isteği reddedildi",
    time: "10:15:20",
  },
  {
    type: "info" as const,
    message: "Güvenlik güncellemesi uygulandı",
    time: "10:10:00",
  },
];

const SystemInfo: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle size={16} />;
      case "warning":
        return <AlertCircle size={16} />;
      case "error":
        return <XCircle size={16} />;
      default:
        return <Activity size={16} />;
    }
  };

  return (
    <Container>
      <Header>
        <Title>
          <Monitor size={32} />
          Sistem Bilgileri
        </Title>
        <RefreshButton onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw size={20} className={isRefreshing ? "animate-spin" : ""} />
          {isRefreshing ? "Yenileniyor..." : "Yenile"}
        </RefreshButton>
      </Header>

      <Grid>
        <Card>
          <CardHeader>
            <CardTitle>
              <Server size={20} />
              Sunucu Durumu
            </CardTitle>
            <StatusBadge status={systemData.server.status}>
              {getStatusIcon(systemData.server.status)}
              {systemData.server.status === "online"
                ? "Çevrimiçi"
                : "Çevrimdışı"}
            </StatusBadge>
          </CardHeader>
          <Metric>
            <MetricLabel>Çalışma Süresi</MetricLabel>
            <MetricValue>{systemData.server.uptime}</MetricValue>
          </Metric>
          <Metric>
            <MetricLabel>Versiyon</MetricLabel>
            <MetricValue>{systemData.server.version}</MetricValue>
          </Metric>
          <Metric>
            <MetricLabel>Son Yeniden Başlatma</MetricLabel>
            <MetricValue>{systemData.server.lastRestart}</MetricValue>
          </Metric>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Database size={20} />
              Veritabanı
            </CardTitle>
            <StatusBadge status={systemData.database.status}>
              {getStatusIcon(systemData.database.status)}
              {systemData.database.status === "online" ? "Aktif" : "Pasif"}
            </StatusBadge>
          </CardHeader>
          <Metric>
            <MetricLabel>Bağlantılar</MetricLabel>
            <MetricValue>
              {systemData.database.connections}/
              {systemData.database.maxConnections}
            </MetricValue>
          </Metric>
          <Metric>
            <MetricLabel>Boyut</MetricLabel>
            <MetricValue>{systemData.database.size}</MetricValue>
          </Metric>
          <Metric>
            <MetricLabel>Sorgu Sayısı</MetricLabel>
            <MetricValue>{systemData.database.queries}/sn</MetricValue>
          </Metric>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Cpu size={20} />
              İşlemci
            </CardTitle>
            <StatusBadge
              status={systemData.cpu.usage > 80 ? "warning" : "online"}
            >
              {systemData.cpu.usage > 80 ? (
                <AlertCircle size={16} />
              ) : (
                <CheckCircle size={16} />
              )}
              %{systemData.cpu.usage} Kullanım
            </StatusBadge>
          </CardHeader>
          <Metric>
            <MetricLabel>Kullanım</MetricLabel>
            <MetricValue>%{systemData.cpu.usage}</MetricValue>
          </Metric>
          <ProgressBar>
            <ProgressFill
              percentage={systemData.cpu.usage}
              color={systemData.cpu.usage > 80 ? "#f59e0b" : "#10b981"}
            />
          </ProgressBar>
          <Metric>
            <MetricLabel>Çekirdek Sayısı</MetricLabel>
            <MetricValue>{systemData.cpu.cores}</MetricValue>
          </Metric>
          <Metric>
            <MetricLabel>Sıcaklık</MetricLabel>
            <MetricValue>{systemData.cpu.temperature}°C</MetricValue>
          </Metric>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <HardDrive size={20} />
              Bellek
            </CardTitle>
            <StatusBadge
              status={systemData.memory.percentage > 90 ? "warning" : "online"}
            >
              {systemData.memory.percentage > 90 ? (
                <AlertCircle size={16} />
              ) : (
                <CheckCircle size={16} />
              )}
              %{systemData.memory.percentage.toFixed(1)}
            </StatusBadge>
          </CardHeader>
          <Metric>
            <MetricLabel>Kullanılan</MetricLabel>
            <MetricValue>
              {systemData.memory.used} GB / {systemData.memory.total} GB
            </MetricValue>
          </Metric>
          <ProgressBar>
            <ProgressFill
              percentage={systemData.memory.percentage}
              color={systemData.memory.percentage > 90 ? "#f59e0b" : "#10b981"}
            />
          </ProgressBar>
          <Metric>
            <MetricLabel>Boş</MetricLabel>
            <MetricValue>
              {(systemData.memory.total - systemData.memory.used).toFixed(1)} GB
            </MetricValue>
          </Metric>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <HardDrive size={20} />
              Disk
            </CardTitle>
            <StatusBadge
              status={systemData.disk.percentage > 85 ? "warning" : "online"}
            >
              {systemData.disk.percentage > 85 ? (
                <AlertCircle size={16} />
              ) : (
                <CheckCircle size={16} />
              )}
              %{systemData.disk.percentage.toFixed(1)}
            </StatusBadge>
          </CardHeader>
          <Metric>
            <MetricLabel>Kullanılan</MetricLabel>
            <MetricValue>
              {systemData.disk.used} GB / {systemData.disk.total} GB
            </MetricValue>
          </Metric>
          <ProgressBar>
            <ProgressFill
              percentage={systemData.disk.percentage}
              color={systemData.disk.percentage > 85 ? "#f59e0b" : "#10b981"}
            />
          </ProgressBar>
          <Metric>
            <MetricLabel>Boş Alan</MetricLabel>
            <MetricValue>{systemData.disk.free}</MetricValue>
          </Metric>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Network size={20} />
              Ağ
            </CardTitle>
            <StatusBadge
              status={systemData.network.errors > 0 ? "error" : "online"}
            >
              {systemData.network.errors > 0 ? (
                <XCircle size={16} />
              ) : (
                <CheckCircle size={16} />
              )}
              {systemData.network.errors > 0 ? "Hata" : "Aktif"}
            </StatusBadge>
          </CardHeader>
          <Metric>
            <MetricLabel>Gelen</MetricLabel>
            <MetricValue>{systemData.network.incoming}</MetricValue>
          </Metric>
          <Metric>
            <MetricLabel>Giden</MetricLabel>
            <MetricValue>{systemData.network.outgoing}</MetricValue>
          </Metric>
          <Metric>
            <MetricLabel>Paketler</MetricLabel>
            <MetricValue>{systemData.network.packets}/sn</MetricValue>
          </Metric>
        </Card>
      </Grid>

      <ChartContainer>
        <ChartTitle>
          <Activity size={20} />
          CPU Kullanımı (Son 7 Gün)
        </ChartTitle>
        <ChartGrid>
          {chartData.map((item, index) => (
            <ChartBar
              key={index}
              height={item.value}
              color={item.color}
              title={`${item.day}: %${item.value}`}
            />
          ))}
        </ChartGrid>
      </ChartContainer>

      <LogContainer>
        <ChartTitle>
          <Clock size={20} />
          Sistem Logları
        </ChartTitle>
        {logEntries.map((entry, index) => (
          <LogEntry key={index} type={entry.type}>
            <LogIcon type={entry.type}>
              {entry.type === "info" && <CheckCircle size={12} />}
              {entry.type === "warning" && <AlertCircle size={12} />}
              {entry.type === "error" && <XCircle size={12} />}
            </LogIcon>
            <LogContent>
              <LogMessage>{entry.message}</LogMessage>
              <LogTime>{entry.time}</LogTime>
            </LogContent>
          </LogEntry>
        ))}
      </LogContainer>
    </Container>
  );
};

export default SystemInfo;
