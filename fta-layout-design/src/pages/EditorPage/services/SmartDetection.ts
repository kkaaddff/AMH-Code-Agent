import { DSLData } from '@/types/dsl';
import { callModelAPI } from './CodeGenerationLoop/index.AgentScheduler.backup';
import { Message, RequestBody } from './CodeGenerationLoop/types';
import intelliPrompt from './intelli-prompt';

export const smartDetection = async (designDsl: DSLData) => {
  const systemMessages: Message[] = [
    {
      role: 'system',
      content: [
        {
          type: 'text',
          text: intelliPrompt(),
          cache_control: { type: 'ephemeral' } as const,
        },
      ],
    },
  ];

  const requestBody: RequestBody = {
    messages: [
      ...systemMessages,
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'designDsl: ' + JSON.stringify(designDsl),
          },
        ],
      },
    ],
    temperature: 0.2,
    chat_template_kwargs: {
      enable_thinking: false,
    },
  };

  // 调用模型 API
  const response = await callModelAPI(requestBody);
  return response;
};

export const smartDetection_test = async (designDsl: DSLData) => {
  const systemMessages: Message[] = [
    {
      role: 'system',
      content: [
        {
          type: 'text',
          text: 'You are a helpful assistant',
        },
      ],
    },
  ];

  // 发送当前消息到模型，禁用 thinking，传递额外 chat_template_kwargs
  const requestBody: RequestBody = {
    messages: [
      ...systemMessages,
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: '你好',
          },
        ],
      },
    ],
    temperature: 0.2,
    chat_template_kwargs: {
      enable_thinking: false,
    },
  };

  // 调用模型 API
  const response = await callModelAPI(requestBody);
  return response;
};
