import React, { useState } from "react";
import styled from "styled-components";
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Palette,
  Globe,
  Lock,
  Save,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store/store";
import { toggleTheme } from "../../store/slices/uiSlice";

const Container = styled.div`
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 2rem;
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

const Subtitle = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  margin: 0.5rem 0 0 0;
  font-size: 1rem;
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
`;

const SettingsSection = styled.div`
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 1rem;
  padding: 1.5rem;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0;
`;

const SectionDescription = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
`;

const SettingItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid ${props => props.theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const SettingInfo = styled.div`
  flex: 1;
`;

const SettingLabel = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin-bottom: 0.25rem;
`;

const SettingDescription = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.textSecondary};
`;

const Toggle = styled.button<{ active: boolean }>`
  width: 3rem;
  height: 1.5rem;
  border-radius: 1rem;
  border: none;
  background: ${props => (props.active ? "#10b981" : "#d1d5db")};
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;

  &::after {
    content: "";
    position: absolute;
    top: 0.125rem;
    left: ${props => (props.active ? "1.625rem" : "0.125rem")};
    width: 1.25rem;
    height: 1.25rem;
    background: white;
    border-radius: 50%;
    transition: all 0.2s ease;
  }
`;

const Select = styled.select`
  padding: 0.5rem 1rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 0.5rem;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  font-size: 0.875rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const Input = styled.input`
  padding: 0.5rem 1rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 0.5rem;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  font-size: 0.875rem;
  width: 200px;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const PasswordInput = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  padding: 0.25rem;

  &:hover {
    color: ${props => props.theme.colors.text};
  }
`;

const SaveButton = styled.button`
  padding: 0.75rem 2rem;
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
  margin-top: 2rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }
`;

const ColorPicker = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const ColorOption = styled.button<{ color: string; active: boolean }>`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 2px solid ${props => (props.active ? "#667eea" : "transparent")};
  background: ${props => props.color};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }
`;

const Settings: React.FC = () => {
  const dispatch = useDispatch();
  const { theme } = useSelector((state: RootState) => state.ui);
  const { user } = useSelector((state: RootState) => state.auth);

  const [settings, setSettings] = useState({
    // Genel Ayarlar
    theme: theme,
    language: "tr",
    timezone: "Europe/Istanbul",

    // Bildirimler
    emailNotifications: true,
    pushNotifications: false,
    securityAlerts: true,
    systemUpdates: true,

    // Güvenlik
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,

    // Gizlilik
    profileVisibility: "public",
    dataSharing: false,
    analytics: true,

    // Görünüm
    sidebarCollapsed: false,
    compactMode: false,
    animations: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const handleToggle = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  const handleSelect = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    // Save settings logic here
    console.log("Settings saved:", settings);
  };

  const themeColors = [
    { name: "Mavi", value: "#667eea" },
    { name: "Mor", value: "#764ba2" },
    { name: "Pembe", value: "#f093fb" },
    { name: "Kırmızı", value: "#f5576c" },
    { name: "Mavi", value: "#4facfe" },
    { name: "Turkuaz", value: "#00f2fe" },
  ];

  return (
    <Container>
      <Header>
        <Title>
          <SettingsIcon size={32} />
          Ayarlar
        </Title>
        <Subtitle>Sistem ayarlarınızı yönetin ve kişiselleştirin</Subtitle>
      </Header>

      <SettingsGrid>
        {/* Genel Ayarlar */}
        <SettingsSection>
          <SectionHeader>
            <User size={24} />
            <div>
              <SectionTitle>Genel Ayarlar</SectionTitle>
              <SectionDescription>
                Temel sistem ayarlarınızı yapılandırın
              </SectionDescription>
            </div>
          </SectionHeader>

          <SettingItem>
            <SettingInfo>
              <SettingLabel>Tema</SettingLabel>
              <SettingDescription>
                Uygulamanın görünüm temasını seçin
              </SettingDescription>
            </SettingInfo>
            <Toggle
              active={settings.theme === "dark"}
              onClick={() => {
                const newTheme = settings.theme === "dark" ? "light" : "dark";
                setSettings(prev => ({ ...prev, theme: newTheme }));
                dispatch(toggleTheme());
              }}
            />
          </SettingItem>

          <SettingItem>
            <SettingInfo>
              <SettingLabel>Dil</SettingLabel>
              <SettingDescription>Uygulama dilini seçin</SettingDescription>
            </SettingInfo>
            <Select
              value={settings.language}
              onChange={e => handleSelect("language", e.target.value)}
            >
              <option value="tr">Türkçe</option>
              <option value="en">English</option>
              <option value="de">Deutsch</option>
            </Select>
          </SettingItem>

          <SettingItem>
            <SettingInfo>
              <SettingLabel>Zaman Dilimi</SettingLabel>
              <SettingDescription>
                Yerel zaman diliminizi ayarlayın
              </SettingDescription>
            </SettingInfo>
            <Select
              value={settings.timezone}
              onChange={e => handleSelect("timezone", e.target.value)}
            >
              <option value="Europe/Istanbul">İstanbul (UTC+3)</option>
              <option value="Europe/London">Londra (UTC+0)</option>
              <option value="America/New_York">New York (UTC-5)</option>
            </Select>
          </SettingItem>
        </SettingsSection>

        {/* Bildirimler */}
        <SettingsSection>
          <SectionHeader>
            <Bell size={24} />
            <div>
              <SectionTitle>Bildirimler</SectionTitle>
              <SectionDescription>
                Bildirim tercihlerinizi yönetin
              </SectionDescription>
            </div>
          </SectionHeader>

          <SettingItem>
            <SettingInfo>
              <SettingLabel>E-posta Bildirimleri</SettingLabel>
              <SettingDescription>
                Önemli güncellemeler için e-posta alın
              </SettingDescription>
            </SettingInfo>
            <Toggle
              active={settings.emailNotifications}
              onClick={() => handleToggle("emailNotifications")}
            />
          </SettingItem>

          <SettingItem>
            <SettingInfo>
              <SettingLabel>Anlık Bildirimler</SettingLabel>
              <SettingDescription>
                Tarayıcı anlık bildirimlerini etkinleştirin
              </SettingDescription>
            </SettingInfo>
            <Toggle
              active={settings.pushNotifications}
              onClick={() => handleToggle("pushNotifications")}
            />
          </SettingItem>

          <SettingItem>
            <SettingInfo>
              <SettingLabel>Güvenlik Uyarıları</SettingLabel>
              <SettingDescription>
                Güvenlik ile ilgili önemli uyarıları alın
              </SettingDescription>
            </SettingInfo>
            <Toggle
              active={settings.securityAlerts}
              onClick={() => handleToggle("securityAlerts")}
            />
          </SettingItem>
        </SettingsSection>

        {/* Güvenlik */}
        <SettingsSection>
          <SectionHeader>
            <Shield size={24} />
            <div>
              <SectionTitle>Güvenlik</SectionTitle>
              <SectionDescription>
                Hesap güvenliğinizi yönetin
              </SectionDescription>
            </div>
          </SectionHeader>

          <SettingItem>
            <SettingInfo>
              <SettingLabel>İki Faktörlü Kimlik Doğrulama</SettingLabel>
              <SettingDescription>
                Hesabınızı ek güvenlik katmanı ile koruyun
              </SettingDescription>
            </SettingInfo>
            <Toggle
              active={settings.twoFactorAuth}
              onClick={() => handleToggle("twoFactorAuth")}
            />
          </SettingItem>

          <SettingItem>
            <SettingInfo>
              <SettingLabel>Oturum Zaman Aşımı</SettingLabel>
              <SettingDescription>
                Otomatik çıkış süresini ayarlayın (dakika)
              </SettingDescription>
            </SettingInfo>
            <Select
              value={settings.sessionTimeout}
              onChange={e => handleSelect("sessionTimeout", e.target.value)}
            >
              <option value={15}>15 dakika</option>
              <option value={30}>30 dakika</option>
              <option value={60}>1 saat</option>
              <option value={120}>2 saat</option>
            </Select>
          </SettingItem>

          <SettingItem>
            <SettingInfo>
              <SettingLabel>Şifre Değiştir</SettingLabel>
              <SettingDescription>
                Hesap şifrenizi güncelleyin
              </SettingDescription>
            </SettingInfo>
            <PasswordInput>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Yeni şifre"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <PasswordToggle onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </PasswordToggle>
            </PasswordInput>
          </SettingItem>
        </SettingsSection>

        {/* Gizlilik */}
        <SettingsSection>
          <SectionHeader>
            <Lock size={24} />
            <div>
              <SectionTitle>Gizlilik</SectionTitle>
              <SectionDescription>
                Veri gizliliği tercihlerinizi yönetin
              </SectionDescription>
            </div>
          </SectionHeader>

          <SettingItem>
            <SettingInfo>
              <SettingLabel>Profil Görünürlüğü</SettingLabel>
              <SettingDescription>
                Profilinizin kimler tarafından görülebileceğini belirleyin
              </SettingDescription>
            </SettingInfo>
            <Select
              value={settings.profileVisibility}
              onChange={e => handleSelect("profileVisibility", e.target.value)}
            >
              <option value="public">Herkes</option>
              <option value="friends">Sadece Arkadaşlar</option>
              <option value="private">Sadece Ben</option>
            </Select>
          </SettingItem>

          <SettingItem>
            <SettingInfo>
              <SettingLabel>Veri Paylaşımı</SettingLabel>
              <SettingDescription>
                Anonim kullanım verilerini paylaşın
              </SettingDescription>
            </SettingInfo>
            <Toggle
              active={settings.dataSharing}
              onClick={() => handleToggle("dataSharing")}
            />
          </SettingItem>

          <SettingItem>
            <SettingInfo>
              <SettingLabel>Analitik</SettingLabel>
              <SettingDescription>
                Kullanım analitiklerini etkinleştirin
              </SettingDescription>
            </SettingInfo>
            <Toggle
              active={settings.analytics}
              onClick={() => handleToggle("analytics")}
            />
          </SettingItem>
        </SettingsSection>

        {/* Görünüm */}
        <SettingsSection>
          <SectionHeader>
            <Palette size={24} />
            <div>
              <SectionTitle>Görünüm</SectionTitle>
              <SectionDescription>
                Arayüz tercihlerinizi özelleştirin
              </SectionDescription>
            </div>
          </SectionHeader>

          <SettingItem>
            <SettingInfo>
              <SettingLabel>Renk Teması</SettingLabel>
              <SettingDescription>
                Uygulamanızın ana rengini seçin
              </SettingDescription>
            </SettingInfo>
            <ColorPicker>
              {themeColors.map(color => (
                <ColorOption
                  key={color.value}
                  color={color.value}
                  active={false}
                  title={color.name}
                />
              ))}
            </ColorPicker>
          </SettingItem>

          <SettingItem>
            <SettingInfo>
              <SettingLabel>Kompakt Mod</SettingLabel>
              <SettingDescription>
                Daha az boşluk ile daha fazla içerik gösterin
              </SettingDescription>
            </SettingInfo>
            <Toggle
              active={settings.compactMode}
              onClick={() => handleToggle("compactMode")}
            />
          </SettingItem>

          <SettingItem>
            <SettingInfo>
              <SettingLabel>Animasyonlar</SettingLabel>
              <SettingDescription>
                Arayüz animasyonlarını etkinleştirin
              </SettingDescription>
            </SettingInfo>
            <Toggle
              active={settings.animations}
              onClick={() => handleToggle("animations")}
            />
          </SettingItem>
        </SettingsSection>
      </SettingsGrid>

      <SaveButton onClick={handleSave}>
        <Save size={20} />
        Ayarları Kaydet
      </SaveButton>
    </Container>
  );
};

export default Settings;
