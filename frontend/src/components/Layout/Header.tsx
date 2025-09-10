import React from "react";
import styled from "styled-components";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store/store";
import { logout } from "../../store/slices/authSlice";
import { toggleTheme } from "../../store/slices/uiSlice";
import { FiMenu, FiSun, FiMoon, FiLogOut, FiUser } from "react-icons/fi";

const HeaderContainer = styled.header`
  background-color: ${props => props.theme.colors.primary};
  color: white;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const ThemeButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
`;

const LogoutButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 600;
  margin: 0;
`;

interface HeaderProps {
  onSidebarToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSidebarToggle }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { theme } = useSelector((state: RootState) => state.ui);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  return (
    <HeaderContainer>
      <LeftSection>
        <MenuButton onClick={onSidebarToggle}>
          <FiMenu />
        </MenuButton>
        <Title>Mikrofrontend Sistemi</Title>
      </LeftSection>

      <RightSection>
        <UserInfo>
          <FiUser />
          <span>{user?.username}</span>
        </UserInfo>

        <ThemeButton onClick={handleThemeToggle}>
          {theme === "light" ? <FiMoon /> : <FiSun />}
        </ThemeButton>

        <LogoutButton onClick={handleLogout}>
          <FiLogOut />
        </LogoutButton>
      </RightSection>
    </HeaderContainer>
  );
};

export default Header;
