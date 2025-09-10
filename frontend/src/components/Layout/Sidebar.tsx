import React from "react";
import styled from "styled-components";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Shield,
  Users,
  Lock,
  Database,
  Settings,
  ShieldCheck,
} from "lucide-react";

const SidebarContainer = styled.aside<{ isOpen: boolean }>`
  position: fixed;
  left: 0;
  top: 0;
  width: 280px;
  height: 100vh;
  background-color: ${props => props.theme.colors.surface};
  border-right: 1px solid ${props => props.theme.colors.border};
  transform: ${props => (props.isOpen ? "translateX(0)" : "translateX(-100%)")};
  transition: transform 0.3s ease;
  z-index: 1000;
  padding-top: 60px;
  overflow-y: auto;
`;

const Logo = styled.div`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  margin-bottom: 1rem;
`;

const LogoText = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin: 0;
`;

const MenuSection = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.div`
  padding: 0 1.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${props => props.theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const MenuList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const MenuItem = styled.li`
  margin: 0;
`;

const MenuLink = styled(Link)<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  color: ${props =>
    props.active ? props.theme.colors.primary : props.theme.colors.text};
  text-decoration: none;
  transition: all 0.2s ease;
  border-right: 3px solid
    ${props => (props.active ? props.theme.colors.primary : "transparent")};
  background: ${props =>
    props.active ? `${props.theme.colors.primary}10` : "transparent"};

  &:hover {
    background: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.primary};
  }
`;

const MenuIcon = styled.div`
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MenuText = styled.span`
  font-weight: 500;
  font-size: 0.875rem;
`;

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <SidebarContainer isOpen={isOpen}>
      <Logo>
        <LogoText>Mikrofrontend</LogoText>
      </Logo>

      <MenuSection>
        <SectionTitle>ANA MENÜ</SectionTitle>
        <MenuList>
          <MenuItem>
            <MenuLink to="/dashboard" active={isActive("/dashboard")}>
              <MenuIcon>
                <Home size={20} />
              </MenuIcon>
              <MenuText>Dashboard</MenuText>
            </MenuLink>
          </MenuItem>
        </MenuList>
      </MenuSection>

      <MenuSection>
        <SectionTitle>MODÜLLER</SectionTitle>
        <MenuList>
          <MenuItem>
            <MenuLink
              to="/modules/authentication"
              active={isActive("/modules/authentication")}
            >
              <MenuIcon>
                <Shield size={20} />
              </MenuIcon>
              <MenuText>Kimlik Doğrulama</MenuText>
            </MenuLink>
          </MenuItem>
          <MenuItem>
            <MenuLink
              to="/modules/user-management"
              active={isActive("/modules/user-management")}
            >
              <MenuIcon>
                <Users size={20} />
              </MenuIcon>
              <MenuText>Kullanıcı Yönetimi</MenuText>
            </MenuLink>
          </MenuItem>
        </MenuList>
      </MenuSection>

      <MenuSection>
        <SectionTitle>TEST ARAÇLARI</SectionTitle>
        <MenuList>
          <MenuItem>
            <MenuLink
              to="/test/encryption"
              active={isActive("/test/encryption")}
            >
              <MenuIcon>
                <Lock size={20} />
              </MenuIcon>
              <MenuText>Şifreleme Testi</MenuText>
            </MenuLink>
          </MenuItem>
          <MenuItem>
            <MenuLink
              to="/test/system-info"
              active={isActive("/test/system-info")}
            >
              <MenuIcon>
                <Database size={20} />
              </MenuIcon>
              <MenuText>Sistem Bilgileri</MenuText>
            </MenuLink>
          </MenuItem>
        </MenuList>
      </MenuSection>

      <MenuSection>
        <SectionTitle>SİSTEM</SectionTitle>
        <MenuList>
          <MenuItem>
            <MenuLink
              to="/system/settings"
              active={isActive("/system/settings")}
            >
              <MenuIcon>
                <Settings size={20} />
              </MenuIcon>
              <MenuText>Ayarlar</MenuText>
            </MenuLink>
          </MenuItem>
          <MenuItem>
            <MenuLink
              to="/system/security"
              active={isActive("/system/security")}
            >
              <MenuIcon>
                <ShieldCheck size={20} />
              </MenuIcon>
              <MenuText>Güvenlik</MenuText>
            </MenuLink>
          </MenuItem>
        </MenuList>
      </MenuSection>
    </SidebarContainer>
  );
};

export default Sidebar;
