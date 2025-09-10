export const lightTheme = {
  colors: {
    primary: "#3B82F6",
    primaryHover: "#2563EB",
    secondary: "#6B7280",
    background: "#FFFFFF",
    surface: "#F9FAFB",
    text: "#111827",
    textSecondary: "#6B7280",
    border: "#E5E7EB",
    hover: "#F3F4F6",
    success: "#10B981",
    error: "#EF4444",
    warning: "#F59E0B",
    info: "#3B82F6",
    disabled: "#9CA3AF",
  },
  shadows: {
    small: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    medium: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    large: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
  },
  borderRadius: {
    small: "4px",
    medium: "8px",
    large: "12px",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  },
};

export const darkTheme = {
  colors: {
    primary: "#3B82F6",
    primaryHover: "#2563EB",
    secondary: "#9CA3AF",
    background: "#111827",
    surface: "#1F2937",
    text: "#F9FAFB",
    textSecondary: "#D1D5DB",
    border: "#374151",
    hover: "#374151",
    success: "#10B981",
    error: "#EF4444",
    warning: "#F59E0B",
    info: "#3B82F6",
    disabled: "#6B7280",
  },
  shadows: {
    small: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
    medium: "0 4px 6px -1px rgba(0, 0, 0, 0.4)",
    large: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
  },
  borderRadius: {
    small: "4px",
    medium: "8px",
    large: "12px",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  },
};

export type Theme = typeof lightTheme;
