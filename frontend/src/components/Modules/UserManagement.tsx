import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  Users,
  UserPlus,
  Edit3,
  Trash2,
  Search,
  Filter,
  Shield,
  Mail,
  Calendar,
  MoreVertical,
} from "lucide-react";
import eventBus from "../../services/eventBus";

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: between;
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

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const Button = styled.button<{ variant?: "primary" | "secondary" | "danger" }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  ${props => {
    switch (props.variant) {
      case "primary":
        return `
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
          }
        `;
      case "danger":
        return `
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
          color: white;
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255, 107, 107, 0.3);
          }
        `;
      default:
        return `
          background: ${props.theme.colors.surface};
          color: ${props.theme.colors.text};
          border: 1px solid ${props.theme.colors.border};
          &:hover {
            background: ${props.theme.colors.background};
            transform: translateY(-1px);
          }
        `;
    }
  }}
`;

const SearchBar = styled.div`
  position: relative;
  flex: 1;
  min-width: 300px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 0.5rem;
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors.textSecondary};
  width: 1.25rem;
  height: 1.25rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => props.color};
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
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background: ${props => props.color}20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.color};
`;

const StatValue = styled.div`
  font-size: 2rem;
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
`;

const TableContainer = styled.div`
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 1rem;
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: ${props => props.theme.colors.background};
`;

const TableRow = styled.tr`
  border-bottom: 1px solid ${props => props.theme.colors.border};

  &:hover {
    background: ${props => props.theme.colors.background};
  }
`;

const TableHeaderCell = styled.th`
  padding: 1rem 1.5rem;
  text-align: left;
  font-weight: 600;
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const TableCell = styled.td`
  padding: 1rem 1.5rem;
  color: ${props => props.theme.colors.text};
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Avatar = styled.div<{ color: string }>`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserName = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const UserEmail = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.textSecondary};
`;

const RoleBadge = styled.span<{ role: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;

  ${props => {
    switch (props.role) {
      case "admin":
        return `
          background: #fef3c7;
          color: #d97706;
        `;
      case "moderator":
        return `
          background: #dbeafe;
          color: #2563eb;
        `;
      default:
        return `
          background: #f3f4f6;
          color: #6b7280;
        `;
    }
  }}
`;

const ActionButton = styled.button`
  padding: 0.5rem;
  border: none;
  background: transparent;
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${props => props.theme.colors.textSecondary};
`;

const EmptyIcon = styled.div`
  width: 4rem;
  height: 4rem;
  margin: 0 auto 1rem;
  border-radius: 50%;
  background: ${props => props.theme.colors.background};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.textSecondary};
`;

// Mock data
const mockUsers = [
  {
    id: 1,
    name: "Ahmet Yılmaz",
    email: "ahmet@example.com",
    role: "admin",
    status: "active",
    lastLogin: "2025-09-10 10:30",
    avatar: "AY",
  },
  {
    id: 2,
    name: "Fatma Demir",
    email: "fatma@example.com",
    role: "moderator",
    status: "active",
    lastLogin: "2025-09-10 09:15",
    avatar: "FD",
  },
  {
    id: 3,
    name: "Mehmet Kaya",
    email: "mehmet@example.com",
    role: "user",
    status: "inactive",
    lastLogin: "2025-09-09 16:45",
    avatar: "MK",
  },
  {
    id: 4,
    name: "Ayşe Özkan",
    email: "ayse@example.com",
    role: "user",
    status: "active",
    lastLogin: "2025-09-10 08:20",
    avatar: "AÖ",
  },
];

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === "active").length,
    admins: users.filter(u => u.role === "admin").length,
    newThisMonth: 2,
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "#667eea",
      "#764ba2",
      "#f093fb",
      "#f5576c",
      "#4facfe",
      "#00f2fe",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <Container>
      <Header>
        <Title>
          <Users size={32} />
          Kullanıcı Yönetimi
        </Title>
        <ActionButtons>
          <Button variant="primary">
            <UserPlus size={20} />
            Yeni Kullanıcı
          </Button>
          <Button>
            <Filter size={20} />
            Filtrele
          </Button>
        </ActionButtons>
      </Header>

      <SearchBar>
        <SearchIcon size={20} />
        <SearchInput
          type="text"
          placeholder="Kullanıcı ara..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </SearchBar>

      <StatsGrid>
        <StatCard color="#667eea">
          <StatHeader>
            <StatTitle>Toplam Kullanıcı</StatTitle>
            <StatIcon color="#667eea">
              <Users size={20} />
            </StatIcon>
          </StatHeader>
          <StatValue>{stats.total}</StatValue>
          <StatChange positive={true}>+{stats.newThisMonth} bu ay</StatChange>
        </StatCard>

        <StatCard color="#10b981">
          <StatHeader>
            <StatTitle>Aktif Kullanıcı</StatTitle>
            <StatIcon color="#10b981">
              <Shield size={20} />
            </StatIcon>
          </StatHeader>
          <StatValue>{stats.active}</StatValue>
          <StatChange positive={true}>
            %{Math.round((stats.active / stats.total) * 100)} aktif
          </StatChange>
        </StatCard>

        <StatCard color="#f59e0b">
          <StatHeader>
            <StatTitle>Yönetici</StatTitle>
            <StatIcon color="#f59e0b">
              <Shield size={20} />
            </StatIcon>
          </StatHeader>
          <StatValue>{stats.admins}</StatValue>
          <StatChange positive={false}>Yönetici sayısı</StatChange>
        </StatCard>

        <StatCard color="#8b5cf6">
          <StatHeader>
            <StatTitle>Yeni Kayıt</StatTitle>
            <StatIcon color="#8b5cf6">
              <UserPlus size={20} />
            </StatIcon>
          </StatHeader>
          <StatValue>{stats.newThisMonth}</StatValue>
          <StatChange positive={true}>Bu ay</StatChange>
        </StatCard>
      </StatsGrid>

      <TableContainer>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Kullanıcı</TableHeaderCell>
              <TableHeaderCell>Rol</TableHeaderCell>
              <TableHeaderCell>Durum</TableHeaderCell>
              <TableHeaderCell>Son Giriş</TableHeaderCell>
              <TableHeaderCell>İşlemler</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <UserInfo>
                      <Avatar color={getAvatarColor(user.name)}>
                        {user.avatar}
                      </Avatar>
                      <UserDetails>
                        <UserName>{user.name}</UserName>
                        <UserEmail>{user.email}</UserEmail>
                      </UserDetails>
                    </UserInfo>
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={user.role}>
                      {user.role === "admin"
                        ? "Yönetici"
                        : user.role === "moderator"
                        ? "Moderatör"
                        : "Kullanıcı"}
                    </RoleBadge>
                  </TableCell>
                  <TableCell>
                    <span
                      style={{
                        color: user.status === "active" ? "#10b981" : "#ef4444",
                        fontWeight: "600",
                      }}
                    >
                      {user.status === "active" ? "Aktif" : "Pasif"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <Calendar size={16} />
                      {user.lastLogin}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <ActionButton title="Düzenle">
                        <Edit3 size={16} />
                      </ActionButton>
                      <ActionButton title="Sil">
                        <Trash2 size={16} />
                      </ActionButton>
                      <ActionButton title="Daha fazla">
                        <MoreVertical size={16} />
                      </ActionButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState>
                    <EmptyIcon>
                      <Users size={32} />
                    </EmptyIcon>
                    <h3>Kullanıcı bulunamadı</h3>
                    <p>Arama kriterlerinize uygun kullanıcı bulunamadı.</p>
                  </EmptyState>
                </TableCell>
              </TableRow>
            )}
          </tbody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default UserManagement;
