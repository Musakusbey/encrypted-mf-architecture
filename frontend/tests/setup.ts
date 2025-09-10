// Jest setup for frontend tests
import "@testing-library/jest-dom";

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock crypto for tests
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: () => "test-uuid-1234",
    getRandomValues: (arr: any) =>
      arr.map(() => Math.floor(Math.random() * 256)),
  },
});

// Mock environment variables
process.env.REACT_APP_API_URL = "http://localhost:3001/api";
process.env.REACT_APP_EVENT_BUS_SECRET = "test-event-bus-secret";

// Global test timeout
jest.setTimeout(10000);
