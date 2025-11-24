import type { ConfettiOptions } from 'canvas-confetti';

export const COLOR_PALETTE = [
  '#667eea',
  '#764ba2',
  '#5a67d8',
  '#6b46c1',
  '#805ad5',
  '#4c51bf',
  '#553c9a',
  '#6366f1',
  '#8b5cf6',
  '#a78bfa',
  '#60a5fa',
  '#818cf8',
  '#a78bfa',
  '#c084fc',
  '#e879f9',
  '#fbbf24',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#f97316',
];

export const SMART_DETECTION_COMPONENT_REGEX = /^[A-Za-z][A-Za-z0-9.]*/;

const baseConfettiOptions: ConfettiOptions = {
  gravity: 1,
  decay: 0.92,
  spread: 80,
  colors: COLOR_PALETTE,
  scalar: 1.4,
};

export const CONFETTI_BURSTS: Array<{ delay: number; options: ConfettiOptions }> = [
  {
    delay: 0,
    options: {
      ...baseConfettiOptions,
      particleCount: 220,
      spread: 120,
      angle: 60,
      scalar: 1.5,
      startVelocity: 60,
      origin: { x: 0.05, y: 0.05 },
    },
  },
];
