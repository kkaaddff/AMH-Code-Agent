export const systemSetting = {
  model: 'glm-4.6',
  metadata: {
    user_id: 'user_text',
  },
  max_tokens: 32000,
  thinking: { budget_tokens: 31999, type: 'enabled' },
  stream: false,
  betas: ['claude-code-20250219', 'interleaved-thinking-2025-05-14', 'fine-grained-tool-streaming-2025-05-14'],
};
