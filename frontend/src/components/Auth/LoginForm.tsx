import React, { useState } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { loginUser, clearError } from "../../store/slices/authSlice";
import { FiUser, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import toast from "react-hot-toast";

const FormContainer = styled.div`
  max-width: 400px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const FormTitle = styled.h2`
  text-align: center;
  margin-bottom: 30px;
  color: ${props => props.theme.colors.text};
  font-size: 28px;
  font-weight: 600;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputGroup = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 15px 45px 15px 50px;
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  font-size: 16px;
  background-color: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }

  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const InputIcon = styled.div`
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors.textSecondary};
  font-size: 18px;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  font-size: 18px;
  padding: 5px;

  &:hover {
    color: ${props => props.theme.colors.text};
  }
`;

const SubmitButton = styled.button<{ disabled?: boolean }>`
  padding: 15px;
  background-color: ${props =>
    props.disabled ? props.theme.colors.disabled : props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: ${props => (props.disabled ? "not-allowed" : "pointer")};
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props =>
      props.disabled
        ? props.theme.colors.disabled
        : props.theme.colors.primaryHover};
  }
`;

const ErrorMessage = styled.div`
  background-color: ${props => props.theme.colors.error};
  color: white;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
`;

const SwitchFormText = styled.p`
  text-align: center;
  margin-top: 20px;
  color: ${props => props.theme.colors.textSecondary};
`;

const SwitchFormLink = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.primary};
  cursor: pointer;
  text-decoration: underline;
  font-size: 14px;

  &:hover {
    color: ${props => props.theme.colors.primaryHover};
  }
`;

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Hata varsa temizle
    if (error) {
      dispatch(clearError());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      toast.error("Kullanıcı adı ve şifre gerekli");
      return;
    }

    try {
      await dispatch(loginUser(formData)).unwrap();
      toast.success("Giriş başarılı!");
    } catch (error) {
      toast.error("Giriş başarısız");
    }
  };

  return (
    <FormContainer>
      <FormTitle>Giriş Yap</FormTitle>

      <Form onSubmit={handleSubmit}>
        <InputGroup>
          <InputIcon>
            <FiUser />
          </InputIcon>
          <Input
            type="text"
            name="username"
            placeholder="Kullanıcı adı"
            value={formData.username}
            onChange={handleInputChange}
            disabled={isLoading}
          />
        </InputGroup>

        <InputGroup>
          <InputIcon>
            <FiLock />
          </InputIcon>
          <Input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Şifre"
            value={formData.password}
            onChange={handleInputChange}
            disabled={isLoading}
          />
          <PasswordToggle
            type="button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </PasswordToggle>
        </InputGroup>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <SubmitButton type="submit" disabled={isLoading}>
          {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </SubmitButton>
      </Form>

      <SwitchFormText>
        Hesabınız yok mu?{" "}
        <SwitchFormLink onClick={onSwitchToRegister}>Kayıt olun</SwitchFormLink>
      </SwitchFormText>
    </FormContainer>
  );
};

export default LoginForm;
