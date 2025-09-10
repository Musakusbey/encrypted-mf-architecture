import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import apiService from "../../services/api";
import {
  Users,
  Shield,
  Database,
  Activity,
  TrendingUp,
  Clock,
  Zap,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

const DashboardContainer = styled.div`
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  margin: 0;
  font-size: 1.125rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div<{ color: string }>`
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
    background: ${props => props.color};
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  }
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const StatTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.theme.colors.textSecondary};
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StatIcon = styled.div<{ color: string }>`
  width: 3rem;
  height: 3rem;
  border-radius: 1rem;
  background: ${props => props.color}20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.color};
`;

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin-bottom: 0.5rem;
`;

const StatChange = styled.div<{ positive: boolean }>`
  font-size: 0.875rem;
  color: ${props => (props.positive ? "#10b981" : "#ef4444")};
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 600;
`;

const ChartSection = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 1rem;
  padding: 1.5rem;
`;

const ChartTitle = styled.h3`
  font-size: 1.25rem;
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
  margin-top: 1rem;
`;

const ChartBar = styled.div<{ height: number; color: string }>`
  background: ${props => props.color};
  border-radius: 0.25rem 0.25rem 0 0;
  height: ${props => props.height}%;
  min-height: 4px;
  transition: height 0.3s ease;
  position: relative;

  &:hover {
    opacity: 0.8;
  }

  &::after {
    content: attr(data-value);
    position: absolute;
    top: -1.5rem;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.75rem;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &:hover::after {
    opacity: 1;
  }
`;

const ModulesSection = styled.div`
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 1rem;
  padding: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ModulesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
`;

const ModuleCard = styled.div<{ status: string }>`
  background: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 0.75rem;
  padding: 1.25rem;
  position: relative;
  transition: all 0.2s ease;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: ${props => (props.status === "active" ? "#10b981" : "#f59e0b")};
    border-radius: 0 0.25rem 0.25rem 0;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const ModuleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const ModuleTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0;
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;

  ${props => {
    switch (props.status) {
      case "active":
        return `
          background: #dcfce7;
          color: #16a34a;
        `;
      case "warning":
        return `
          background: #fef3c7;
          color: #d97706;
        `;
      default:
        return `
          background: #f3f4f6;
          color: #6b7280;
        `;
    }
  }}
`;

const ModuleInfo = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const ModuleDetail = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ModuleLabel = styled.span`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
`;

const ModuleValue = styled.span`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text};
  font-weight: 500;
`;

const QuickActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
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

  &:hover {
    background: ${props => props.theme.colors.primary};
    color: white;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const Dashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiService.get("/api/modules");
        setModules(response.data.modules || []);
      } catch (error) {
        console.error("Modüller yüklenirken hata:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = {
    activeUsers: 1,
    activeModules: modules.filter(m => m.status === "active").length,
    totalModules: modules.length,
    systemHealth: "healthy",
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

  const recentActivity = [
    { action: "Yeni kullanıcı kaydı", time: "2 dakika önce", type: "success" },
    { action: "Sistem güncellemesi", time: "15 dakika önce", type: "info" },
    { action: "Güvenlik taraması", time: "1 saat önce", type: "success" },
    { action: "Veritabanı yedekleme", time: "2 saat önce", type: "info" },
  ];

  return (
    <DashboardContainer>
      <Header>
        <Title>Dashboard</Title>
        <Subtitle>
          Hoş geldin, {user?.username}! Sistemin genel durumunu buradan takip
          edebilirsin.
        </Subtitle>
      </Header>

      <StatsGrid>
        <StatCard color="#667eea">
          <StatHeader>
            <StatTitle>Aktif Kullanıcı</StatTitle>
            <StatIcon color="#667eea">
              <Users size={24} />
            </StatIcon>
          </StatHeader>
          <StatValue>{user?.username || "test"}</StatValue>
          <StatChange positive={true}>
            <ArrowUp size={16} />
            +1 bu hafta
          </StatChange>
        </StatCard>

        <StatCard color="#10b981">
          <StatHeader>
            <StatTitle>Aktif Modül</StatTitle>
            <StatIcon color="#10b981">
              <Shield size={24} />
            </StatIcon>
          </StatHeader>
          <StatValue>{stats.activeModules}</StatValue>
          <StatChange positive={true}>
            <ArrowUp size={16} />
            %100 aktif
          </StatChange>
        </StatCard>

        <StatCard color="#8b5cf6">
          <StatHeader>
            <StatTitle>Toplam Modül</StatTitle>
            <StatIcon color="#8b5cf6">
              <Database size={24} />
            </StatIcon>
          </StatHeader>
          <StatValue>{stats.totalModules}</StatValue>
          <StatChange positive={true}>
            <ArrowUp size={16} />
            +2 bu ay
          </StatChange>
        </StatCard>

        <StatCard color="#f59e0b">
          <StatHeader>
            <StatTitle>Sistem Durumu</StatTitle>
            <StatIcon color="#f59e0b">
              <Zap size={24} />
            </StatIcon>
          </StatHeader>
          <StatValue style={{ fontSize: "1.5rem" }}>Sağlıklı</StatValue>
          <StatChange positive={true}>
            <CheckCircle size={16} />
            Tüm sistemler çalışıyor
          </StatChange>
        </StatCard>
      </StatsGrid>

      <ChartSection>
        <ChartCard>
          <ChartTitle>
            <BarChart3 size={20} />
            Haftalık Aktivite
          </ChartTitle>
          <ChartGrid>
            {chartData.map((item, index) => (
              <ChartBar
                key={index}
                height={item.value}
                color={item.color}
                data-value={`${item.day}: %${item.value}`}
              />
            ))}
          </ChartGrid>
        </ChartCard>

        <ChartCard>
          <ChartTitle>
            <PieChart size={20} />
            Son Aktiviteler
          </ChartTitle>
          <div style={{ marginTop: "1rem" }}>
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 0",
                  borderBottom:
                    index < recentActivity.length - 1
                      ? `1px solid ${props =>
                          props.theme?.colors?.border || "#e5e7eb"}`
                      : "none",
                }}
              >
                <div
                  style={{
                    width: "0.5rem",
                    height: "0.5rem",
                    borderRadius: "50%",
                    background:
                      activity.type === "success" ? "#10b981" : "#3b82f6",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: props => props.theme?.colors?.text || "#111827",
                    }}
                  >
                    {activity.action}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: props =>
                        props.theme?.colors?.textSecondary || "#6b7280",
                    }}
                  >
                    {activity.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </ChartSection>

      <ModulesSection>
        <SectionTitle>
          <Database size={24} />
          Mikrofrontend Modülleri
        </SectionTitle>
        <ModulesGrid>
          {loading ? (
            <div>Yükleniyor...</div>
          ) : (
            modules.map(module => (
              <ModuleCard key={module.id} status={module.status}>
                <ModuleHeader>
                  <ModuleTitle>{module.name}</ModuleTitle>
                  <StatusBadge status={module.status}>
                    {module.status === "active" ? "Aktif" : "Pasif"}
                  </StatusBadge>
                </ModuleHeader>
                <ModuleInfo>
                  <ModuleDetail>
                    <ModuleLabel>ID</ModuleLabel>
                    <ModuleValue>{module.id}</ModuleValue>
                  </ModuleDetail>
                  <ModuleDetail>
                    <ModuleLabel>Versiyon</ModuleLabel>
                    <ModuleValue>{module.version}</ModuleValue>
                  </ModuleDetail>
                  <ModuleDetail>
                    <ModuleLabel>Endpoint Sayısı</ModuleLabel>
                    <ModuleValue>{module.endpoint_count}</ModuleValue>
                  </ModuleDetail>
                  <ModuleDetail>
                    <ModuleLabel>Durum</ModuleLabel>
                    <ModuleValue
                      style={{
                        color:
                          module.status === "active" ? "#10b981" : "#f59e0b",
                        fontWeight: "600",
                      }}
                    >
                      {module.status === "active" ? "Aktif" : "Pasif"}
                    </ModuleValue>
                  </ModuleDetail>
                </ModuleInfo>
                <QuickActions>
                  <ActionButton>Detaylar</ActionButton>
                  <ActionButton>Yönet</ActionButton>
                </QuickActions>
              </ModuleCard>
            ))
          )}
        </ModulesGrid>
      </ModulesSection>
    </DashboardContainer>
  );
};

export default Dashboard;
