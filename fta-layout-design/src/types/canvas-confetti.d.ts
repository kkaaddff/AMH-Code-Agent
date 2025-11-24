declare module 'canvas-confetti' {
  export interface ConfettiOptions {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
    shapes?: Array<'square' | 'circle'>;
    scalar?: number;
  }

  export interface ConfettiCreateOptions {
    resize?: boolean;
    useWorker?: boolean;
  }

  export interface ConfettiInstance {
    (options?: ConfettiOptions): Promise<null>;
    reset?: () => void;
  }

  interface ConfettiGlobal extends ConfettiInstance {
    create(canvas: HTMLCanvasElement, options?: ConfettiCreateOptions): ConfettiInstance;
    reset: () => void;
  }

  const confetti: ConfettiGlobal;
  export default confetti;
}
