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

const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

export const CONFETTI_BURSTS: Array<{ delay: number; options: ConfettiOptions }> = [
  {
    delay: 0,
    options: {
      ...baseConfettiOptions,
      particleCount: 180,
      spread: 140,
      scalar: 1.6,
      origin: { x: 0.5, y: 0.55 },
      startVelocity: 58,
    },
  },
  {
    delay: 450,
    options: {
      ...baseConfettiOptions,
      particleCount: 120,
      spread: 70,
      angle: 60,
      origin: { x: 0.2, y: 0.75 },
      scalar: 1.5,
      startVelocity: 50,
    },
  },
  {
    delay: 900,
    options: {
      ...baseConfettiOptions,
      particleCount: 120,
      spread: 70,
      angle: 120,
      origin: { x: 0.8, y: 0.75 },
      scalar: 1.5,
      startVelocity: 50,
    },
  },
  // Randomized mid fireworks
  ...Array.from({ length: 2 }).map((_, i) => ({
    delay: 500 + i * 250,
    options: {
      ...baseConfettiOptions,
      particleCount: 50,
      spread: 90,
      startVelocity: 35,
      scalar: randomInRange(1.1, 1.4),
      origin: { x: randomInRange(0.2, 0.8), y: randomInRange(0.2, 0.55) },
    },
  })),
  {
    delay: 2000,
    options: {
      ...baseConfettiOptions,
      particleCount: 240,
      spread: 160,
      origin: { x: 0.5, y: 0.45 },
      scalar: 1.7,
      startVelocity: 60,
    },
  },
];
