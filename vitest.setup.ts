import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Mock ResizeObserver for Radix UI components
global.ResizeObserver = class ResizeObserver {
  observe() {
    // Mock implementation
  }
  unobserve() {
    // Mock implementation
  }
  disconnect() {
    // Mock implementation
  }
};

// Mock IntersectionObserver if needed
global.IntersectionObserver = class IntersectionObserver {
  observe() {
    // Mock implementation
  }
  unobserve() {
    // Mock implementation
  }
  disconnect() {
    // Mock implementation
  }
  takeRecords() {
    return [];
  }
  root = null;
  rootMargin = "";
  thresholds = [];
} as typeof IntersectionObserver;

// Cleanup after each test
afterEach(() => {
  cleanup();
});
