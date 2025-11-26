import { DSLData, DSLNode } from '@/types/dsl';
import { callModelAPI } from './CodeGenerationLoop/index.AgentScheduler.backup';
import { Message, RequestBody } from './CodeGenerationLoop/types';
import intelliPrompt from './intelli-prompt';

const filterHiddenNodes = (nodes?: DSLNode[]): DSLNode[] => {
  if (!nodes) return [];

  return nodes
    .filter((node) => !(node.hidden || node.mask === 'outline'))
    .map((node) => {
      const sanitizedNode: DSLNode = { ...node };
      const filteredChildren = filterHiddenNodes(node.children);

      if (filteredChildren.length) {
        sanitizedNode.children = filteredChildren;
      } else {
        delete sanitizedNode.children;
      }

      return sanitizedNode;
    });
};

export const smartDetection = async (DesignData: DSLData) => {
  const sanitizedDesignData: DSLData = {
    ...DesignData,
    nodes: filterHiddenNodes(DesignData.nodes),
  };

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
            text: 'DesignData: ' + JSON.stringify(sanitizedDesignData),
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
