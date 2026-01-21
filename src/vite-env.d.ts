/// <reference types="vite/client" />

declare global {
  interface Window {
    Buffer: typeof import('buffer').Buffer;
  }
}

export {};/// <reference types="vite/client" />
