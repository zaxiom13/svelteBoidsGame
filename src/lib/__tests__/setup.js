import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/svelte';
import * as matchers from '@testing-library/jest-dom/matchers';
import '@testing-library/jest-dom';

expect.extend(matchers);

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
};

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn((key) => {
        return localStorageMock.store[key] || null;
    }),
    setItem: vi.fn((key, value) => {
        localStorageMock.store[key] = value;
    }),
    clear: vi.fn(() => {
        localStorageMock.store = {};
    }),
    removeItem: vi.fn((key) => {
        delete localStorageMock.store[key];
    }),
    store: {},
};

global.localStorage = localStorageMock;

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    localStorage.clear();
});