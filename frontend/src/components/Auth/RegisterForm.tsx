import React, { useState } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { registerUser, clearError } from "../../store/slices/authSlice";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
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

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    if (!formData.username || !formData.email || !formData.password) {
      toast.error("Tüm alanlar gerekli");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Şifreler eşleşmiyor");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalı");
      return;
    }

    try {
      await dispatch(
        registerUser({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        })
      ).unwrap();
      toast.success("Kayıt başarılı!");
    } catch (error) {
      toast.error("Kayıt başarısız");
    }
  };

  return (
    <FormContainer>
      <FormTitle>Kayıt Ol</FormTitle>

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
            <FiMail />
          </InputIcon>
          <Input
            type="email"
            name="email"
            placeholder="E-posta"
            value={formData.email}
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

        <InputGroup>
          <InputIcon>
            <FiLock />
          </InputIcon>
          <Input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Şifre tekrar"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            disabled={isLoading}
          />
          <PasswordToggle
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
          </PasswordToggle>
        </InputGroup>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <SubmitButton type="submit" disabled={isLoading}>
          {isLoading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
        </SubmitButton>
      </Form>

      <SwitchFormText>
        Zaten hesabınız var mı?{" "}
        <SwitchFormLink onClick={onSwitchToLogin}>Giriş yapın</SwitchFormLink>
      </SwitchFormText>
    </FormContainer>
  );
};

export default RegisterForm;
