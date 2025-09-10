import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import { ThemeProvider } from "styled-components";
import { Toaster } from "react-hot-toast";
import { store } from "./store/store";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "./store/store";
import { verifyToken } from "./store/slices/authSlice";
import { lightTheme, darkTheme } from "./theme/theme";
import Layout from "./components/Layout/Layout";
import LoginForm from "./components/Auth/LoginForm";
import RegisterForm from "./components/Auth/RegisterForm";
import Dashboard from "./components/Modules/Dashboard";
import EncryptionTest from "./components/Modules/EncryptionTest";
import UserManagement from "./components/Modules/UserManagement";
import SystemInfo from "./components/Modules/SystemInfo";
import Settings from "./components/Modules/Settings";
import SecurityDashboard from "./components/Modules/SecurityDashboard";

const AppContent: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.auth
  );
  const { theme } = useSelector((state: RootState) => state.ui);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    // Token varsa doğrula
    if (localStorage.getItem("token")) {
      dispatch(verifyToken());
    }
  }, [dispatch]);

  const currentTheme = theme === "dark" ? darkTheme : lightTheme;

  if (isLoading) {
    return (
      <ThemeProvider theme={currentTheme}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            backgroundColor: currentTheme.colors.background,
            color: currentTheme.colors.text,
          }}
        >
          Yükleniyor...
        </div>
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={currentTheme}>
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: currentTheme.colors.background,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {showRegister ? (
            <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
          ) : (
            <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
          )}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: currentTheme.colors.surface,
                color: currentTheme.colors.text,
                border: `1px solid ${currentTheme.colors.border}`,
              },
            }}
          />
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={currentTheme}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/modules/authentication"
              element={<UserManagement />}
            />
            <Route
              path="/modules/user-management"
              element={<UserManagement />}
            />
            <Route path="/test/encryption" element={<EncryptionTest />} />
            <Route path="/test/system-info" element={<SystemInfo />} />
            <Route path="/system/settings" element={<Settings />} />
            <Route path="/system/security" element={<SecurityDashboard />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: currentTheme.colors.surface,
                color: currentTheme.colors.text,
                border: `1px solid ${currentTheme.colors.border}`,
              },
            }}
          />
        </Layout>
      </Router>
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;
