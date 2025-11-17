import { commonSystemPrompt } from './CodeGenerationLoop/CommonPrompt';
import { callModelAPI } from './CodeGenerationLoop/index.AgentScheduler.backup';
import { Message, RequestBody } from './CodeGenerationLoop/types';

export const smartDetection = async (messages: Message[]) => {
  const systemMessages: Message[] = [
    {
      role: 'system',
      content: [
        {
          type: 'text',
          text: commonSystemPrompt.cliPrompt,
          cache_control: { type: 'ephemeral' } as const,
        },
      ],
    },
  ];

  // 发送当前消息到模型，关闭 thinking
  const requestBody: RequestBody = {
    messages: [...systemMessages, ...messages],
    temperature: 0.2,
    // 显式关闭 thinking（如果该参数被支持）
    thinking: {
      type: 'disabled',
    },
  };

  // 调用模型 API
  const response = await callModelAPI(requestBody);
  return response;
};
