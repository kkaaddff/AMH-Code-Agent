import { LeafNodeInfo, AIRecognitionResult } from '../types/componentDetection';
import ftaComponents from '@/demo/FTAComponents.json';

// Common component mappings based on node types
const TYPE_TO_COMPONENT_MAP: Record<string, string[]> = {
  TEXT: ['Text', 'Button', 'NavBarButton', 'Tag', 'Badge'],
  LAYER: ['Image', 'Avatar', 'Card', 'Layout'],
  PATH: ['Icon', 'Line', 'Divider'],
  FRAME: ['Button', 'Card', 'Input', 'Layout', 'Flex'],
  INSTANCE: ['Button', 'Input', 'Image', 'Icon'],
};

/**
 * 为叶子节点生成模拟的 AI 识别结果，包含置信度与组件建议。
 * @param leafNodes 需要识别的叶子节点列表
 * @returns 节点 ID 到识别结果的映射表
 */
export function generateMockRecognition(leafNodes: LeafNodeInfo[]): Map<string, AIRecognitionResult> {
  const recognitions = new Map<string, AIRecognitionResult>();

  leafNodes.forEach((leafNode) => {
    // 70% chance of being recognized by AI
    const shouldRecognize = Math.random() < 0.7;

    if (shouldRecognize) {
      // Get possible components for this node type
      const possibleComponents = TYPE_TO_COMPONENT_MAP[leafNode.type] || ftaComponents.slice(0, 5);

      // Pick a random component
      const ftaComponent = possibleComponents[Math.floor(Math.random() * possibleComponents.length)];

      // Generate confidence between 0.6 and 0.95
      const confidence = 0.6 + Math.random() * 0.35;

      // Generate some suggested properties based on component type
      const properties = generateSuggestedProperties(ftaComponent, leafNode);

      recognitions.set(leafNode.id, {
        nodeId: leafNode.id,
        ftaComponent,
        confidence,
        properties,
      });
    }
    // Otherwise, node is unrecognized (not added to map)
  });

  return recognitions;
}

/**
 * Generate suggested properties based on FTA component type
 */
function generateSuggestedProperties(ftaComponent: string, leafNode: LeafNodeInfo): Record<string, any> {
  const properties: Record<string, any> = {};

  // Add common properties based on component type
  switch (ftaComponent) {
    case 'Button':
      properties.type = Math.random() > 0.5 ? 'primary' : 'default';
      break;
    case 'Input':
      properties.placeholder = 'Enter text';
      break;
    case 'Text':
      // Check if node has text content
      if (leafNode.node.type === 'TEXT' && 'text' in leafNode.node) {
        const textNode = leafNode.node as any;
        if (textNode.text && textNode.text[0]?.text) {
          properties.content = textNode.text[0].text;
        }
      }
      break;
    case 'Image':
    case 'Avatar':
      properties.src = 'https://via.placeholder.com/150';
      break;
    case 'Icon':
      properties.name = 'icon-default';
      break;
  }

  return properties;
}

/**
 * 手动指定或更新节点的 AI 识别结果。
 * @param recognitions 当前的识别结果映射
 * @param nodeId 目标节点 ID
 * @param ftaComponent 指定的组件类型
 * @param confidence 可选的置信度，不传时默认为 1
 * @returns 更新后的识别结果映射
 */
export function updateRecognition(
  recognitions: Map<string, AIRecognitionResult>,
  nodeId: string,
  ftaComponent: string,
  confidence?: number
): Map<string, AIRecognitionResult> {
  const newRecognitions = new Map(recognitions);

  newRecognitions.set(nodeId, {
    nodeId,
    ftaComponent,
    confidence: confidence || 1.0, // Manual assignments have 100% confidence
    properties: {},
  });

  return newRecognitions;
}

/**
 * 清除指定节点的 AI 识别结果，将其标记为未识别。
 * @param recognitions 当前的识别结果映射
 * @param nodeId 目标节点 ID
 * @returns 更新后的识别结果映射
 */
export function clearRecognition(
  recognitions: Map<string, AIRecognitionResult>,
  nodeId: string
): Map<string, AIRecognitionResult> {
  const newRecognitions = new Map(recognitions);
  newRecognitions.delete(nodeId);
  return newRecognitions;
}
