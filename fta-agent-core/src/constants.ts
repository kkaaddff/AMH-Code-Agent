export const PRODUCT_NAME = 'FTA CODE AGENT';
export const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.tif']);
export const CANCELED_MESSAGE_TEXT = '[Request interrupted by user]';

export enum TOOL_NAMES {
  TODO_WRITE = 'todoWrite',
  TODO_READ = 'todoRead',
  BASH = 'bash',
  BASH_OUTPUT = 'bash_output',
  KILL_BASH = 'kill_bash',
  VERIFY = 'verify',
}

// Reserve 20% buffer for small models
export const MIN_TOKEN_THRESHOLD = 32_000 * 0.8;

export const BACKGROUND_THRESHOLD_MS = 2000;
