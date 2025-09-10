import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  theme: "light" | "dark";
  sidebarOpen: boolean;
  loading: boolean;
  notifications: Notification[];
  currentModule: string | null;
}

interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  timestamp: number;
}

const initialState: UiState = {
  theme: "light",
  sidebarOpen: true,
  loading: false,
  notifications: [],
  currentModule: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleTheme: state => {
      state.theme = state.theme === "light" ? "dark" : "light";
    },
    setTheme: (state, action: PayloadAction<"light" | "dark">) => {
      state.theme = action.payload;
    },
    toggleSidebar: state => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    addNotification: (
      state,
      action: PayloadAction<Omit<Notification, "id" | "timestamp">>
    ) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearNotifications: state => {
      state.notifications = [];
    },
    setCurrentModule: (state, action: PayloadAction<string | null>) => {
      state.currentModule = action.payload;
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  setLoading,
  addNotification,
  removeNotification,
  clearNotifications,
  setCurrentModule,
} = uiSlice.actions;

export default uiSlice.reducer;
