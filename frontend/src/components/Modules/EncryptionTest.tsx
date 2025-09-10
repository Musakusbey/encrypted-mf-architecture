import React, { useState } from "react";
import styled from "styled-components";
import apiService from "../../services/api";
import encryption from "../../utils/encryption";
import { FiLock, FiUnlock, FiCheck, FiX, FiCopy } from "react-icons/fi";
import toast from "react-hot-toast";

const TestContainer = styled.div`
  padding: 20px;
`;

const TestTitle = styled.h1`
  color: ${props => props.theme.colors.text};
  margin-bottom: 30px;
  font-size: 32px;
  font-weight: 600;
`;

const TestSection = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
  color: ${props => props.theme.colors.text};
  margin-bottom: 20px;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const InputGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  font-size: 14px;
  font-family: "Courier New", monospace;
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
`;

const Button = styled.button<{ variant?: "primary" | "secondary" }>`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;

  ${props =>
    props.variant === "primary"
      ? `
    background-color: ${props.theme.colors.primary};
    color: white;
    
    &:hover {
      background-color: ${props.theme.colors.primaryHover};
    }
  `
      : `
    background-color: ${props.theme.colors.surface};
    color: ${props.theme.colors.text};
    border: 2px solid ${props.theme.colors.border};
    
    &:hover {
      background-color: ${props.theme.colors.hover};
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ResultContainer = styled.div`
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
`;

const ResultTitle = styled.h3`
  color: ${props => props.theme.colors.text};
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
`;

const StatusIndicator = styled.div<{ success: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: ${props => (props.success ? "#10B981" : "#EF4444")};
  font-weight: 500;
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.2s;

  &:hover {
    color: ${props => props.theme.colors.text};
  }
`;

const EncryptionTest: React.FC = () => {
  const [testData, setTestData] = useState(
    '{"message": "Test verisi", "timestamp": "' +
      new Date().toISOString() +
      '"}'
  );
  const [localResult, setLocalResult] = useState<any>(null);
  const [serverResult, setServerResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleLocalTest = () => {
    try {
      const parsedData = JSON.parse(testData);
      const encrypted = encryption.encrypt(parsedData);
      const decrypted = encryption.decrypt(encrypted);

      setLocalResult({
        success: true,
        original: parsedData,
        encrypted: encrypted,
        decrypted: decrypted,
        isMatch: JSON.stringify(parsedData) === JSON.stringify(decrypted),
      });

      toast.success("Yerel şifreleme testi başarılı!");
    } catch (error) {
      setLocalResult({
        success: false,
        error: "Geçersiz JSON formatı veya şifreleme hatası",
      });
      toast.error("Yerel şifreleme testi başarısız!");
    }
  };

  const handleServerTest = async () => {
    try {
      setLoading(true);
      const parsedData = JSON.parse(testData);
      const result = await apiService.testEncryption(parsedData);

      setServerResult({
        success: true,
        ...result,
      });

      toast.success("Sunucu şifreleme testi başarılı!");
    } catch (error: any) {
      setServerResult({
        success: false,
        error: error.response?.data?.error || "Sunucu testi başarısız",
      });
      toast.error("Sunucu şifreleme testi başarısız!");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Panoya kopyalandı!");
  };

  return (
    <TestContainer>
      <TestTitle>Şifreleme Test Aracı</TestTitle>

      <TestSection>
        <SectionTitle>
          <FiLock />
          Test Verisi
        </SectionTitle>

        <InputGroup>
          <Label>JSON Test Verisi:</Label>
          <TextArea
            value={testData}
            onChange={e => setTestData(e.target.value)}
            placeholder="Test edilecek JSON verisini girin..."
          />
        </InputGroup>

        <ButtonGroup>
          <Button variant="primary" onClick={handleLocalTest}>
            <FiLock />
            Yerel Şifreleme Testi
          </Button>
          <Button
            variant="primary"
            onClick={handleServerTest}
            disabled={loading}
          >
            <FiUnlock />
            {loading ? "Test Ediliyor..." : "Sunucu Şifreleme Testi"}
          </Button>
        </ButtonGroup>
      </TestSection>

      {localResult && (
        <TestSection>
          <SectionTitle>
            <FiCheck />
            Yerel Test Sonucu
          </SectionTitle>

          <StatusIndicator success={localResult.success}>
            {localResult.success ? <FiCheck /> : <FiX />}
            {localResult.success ? "Başarılı" : "Başarısız"}
          </StatusIndicator>

          {localResult.success ? (
            <>
              <ResultContainer>
                <ResultTitle>Orijinal Veri:</ResultTitle>
                <TextArea
                  value={JSON.stringify(localResult.original, null, 2)}
                  readOnly
                />
                <CopyButton
                  onClick={() =>
                    copyToClipboard(
                      JSON.stringify(localResult.original, null, 2)
                    )
                  }
                >
                  <FiCopy />
                </CopyButton>
              </ResultContainer>

              <ResultContainer>
                <ResultTitle>Şifrelenmiş Veri:</ResultTitle>
                <TextArea
                  value={JSON.stringify(localResult.encrypted, null, 2)}
                  readOnly
                />
                <CopyButton
                  onClick={() =>
                    copyToClipboard(
                      JSON.stringify(localResult.encrypted, null, 2)
                    )
                  }
                >
                  <FiCopy />
                </CopyButton>
              </ResultContainer>

              <ResultContainer>
                <ResultTitle>Çözülmüş Veri:</ResultTitle>
                <TextArea
                  value={JSON.stringify(localResult.decrypted, null, 2)}
                  readOnly
                />
                <CopyButton
                  onClick={() =>
                    copyToClipboard(
                      JSON.stringify(localResult.decrypted, null, 2)
                    )
                  }
                >
                  <FiCopy />
                </CopyButton>
              </ResultContainer>

              <StatusIndicator success={localResult.isMatch}>
                {localResult.isMatch ? <FiCheck /> : <FiX />}
                Veri Bütünlüğü: {localResult.isMatch ? "Doğru" : "Hatalı"}
              </StatusIndicator>
            </>
          ) : (
            <ResultContainer>
              <div style={{ color: "#EF4444" }}>{localResult.error}</div>
            </ResultContainer>
          )}
        </TestSection>
      )}

      {serverResult && (
        <TestSection>
          <SectionTitle>
            <FiUnlock />
            Sunucu Test Sonucu
          </SectionTitle>

          <StatusIndicator success={serverResult.success}>
            {serverResult.success ? <FiCheck /> : <FiX />}
            {serverResult.success ? "Başarılı" : "Başarısız"}
          </StatusIndicator>

          {serverResult.success ? (
            <>
              <ResultContainer>
                <ResultTitle>Sunucu Yanıtı:</ResultTitle>
                <TextArea
                  value={JSON.stringify(serverResult, null, 2)}
                  readOnly
                />
                <CopyButton
                  onClick={() =>
                    copyToClipboard(JSON.stringify(serverResult, null, 2))
                  }
                >
                  <FiCopy />
                </CopyButton>
              </ResultContainer>
            </>
          ) : (
            <ResultContainer>
              <div style={{ color: "#EF4444" }}>{serverResult.error}</div>
            </ResultContainer>
          )}
        </TestSection>
      )}
    </TestContainer>
  );
};

export default EncryptionTest;
