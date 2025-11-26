import { DSLData } from '@/types/dsl';
import { callModelAPI } from './CodeGenerationLoop/index.AgentScheduler.backup';
import { Message, RequestBody } from './CodeGenerationLoop/types';
import intelliPrompt from './intelli-prompt';

export const smartDetection = async (DesignData: DSLData) => {
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
            text: 'DesignData: ' + JSON.stringify(DesignData),
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
