import React from "react";
import styled from "styled-components";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store/store";
import { toggleSidebar } from "../../store/slices/uiSlice";
import Sidebar from "./Sidebar";
import Header from "./Header";

const LayoutContainer = styled.div<{ sidebarOpen: boolean }>`
  display: flex;
  height: 100vh;
  background-color: ${props => props.theme.colors.background};
`;

const MainContent = styled.main<{ sidebarOpen: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: ${props => (props.sidebarOpen ? "280px" : "0")};
  transition: margin-left 0.3s ease;
  overflow: hidden;
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 0;
  overflow-y: auto;
  background-color: ${props => props.theme.colors.background};
`;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const dispatch = useDispatch();
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const handleSidebarToggle = () => {
    dispatch(toggleSidebar());
  };

  const handleSidebarClose = () => {
    dispatch(toggleSidebar());
  };

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <LayoutContainer sidebarOpen={sidebarOpen}>
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
      <MainContent sidebarOpen={sidebarOpen}>
        <Header onSidebarToggle={handleSidebarToggle} />
        <ContentArea>{children}</ContentArea>
      </MainContent>
    </LayoutContainer>
  );
};

export default Layout;
