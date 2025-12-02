/**
 * AI Schema 解析服务
 * 将 prompt 和结构处理逻辑放在前端，通过 model-gateway-sync 调用统一大模型
 */

import type { SchemaField, ParseSchemaRequest } from '@/types/dataModel';
import { syncModelGateway, StreamModelGatewayEvent } from '../utils/modelGateway';

/**
 * 构建 AI Schema 解析的 prompt
 */
const buildSchemaParsePrompt = (hint: 'json' | 'typescript' | 'text'): string => {
  const hintDescription = {
    json: 'JSON 数据格式',
    typescript: 'TypeScript 类型定义',
    text: '自然语言描述',
  }[hint];

  return `## 角色：数据结构解析专家

你是一个专业的数据结构解析专家，擅长从各种格式的输入中提取并标准化数据结构定义。

## 核心任务

分析用户提供的 **${hintDescription}** 输入，将其转换为标准化的 Schema 字段数组。

## 输出格式

你的输出**必须**是一个有效的 JSON 数组，包含 SchemaField 对象。每个 SchemaField 对象的结构如下：

\`\`\`typescript
interface SchemaField {
  /** 字段名 */
  name: string;
  /** 字段类型: 'string' | 'number' | 'boolean' | 'object' | 'array' */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  /** 字段描述 */
  description?: string;
  /** 是否必填 */
  required?: boolean;
  /** 示例值 */
  example?: any;
  /** 枚举值（如果是枚举类型） */
  enum?: string[];
  /** 子字段（如果是 object 类型） */
  properties?: SchemaField[];
  /** 数组元素类型（如果是 array 类型） */
  items?: SchemaField;
}
\`\`\`

## 解析规则

### 1. 类型映射
- JSON 中的 \`string\` → type: 'string'
- JSON 中的 \`number\`/\`integer\` → type: 'number'
- JSON 中的 \`boolean\` → type: 'boolean'
- JSON 中的嵌套对象 \`{}\` → type: 'object'，子字段放入 \`properties\`
- JSON 中的数组 \`[]\` → type: 'array'，元素类型放入 \`items\`

### 2. 字段名规范
- 保持原始字段名的命名风格（camelCase、snake_case 等）
- 如果是自然语言描述，推断合理的英文字段名

### 3. 必填字段判断
- 如果输入中明确标注了 "必填"、"required" 等，设置 \`required: true\`
- 从 JSON 示例中无法判断时，默认 \`required: false\`

### 4. 示例值提取
- 从 JSON 数据中提取实际的值作为 \`example\`
- 对于嵌套对象和数组，也要递归提取示例值

### 5. 描述字段
- 如果有注释或文档说明，提取作为 \`description\`
- 从字段名推断可能的用途描述

## 输出要求

1. **只输出 JSON 数组**，不要包含任何其他文字、标题或说明
2. JSON 必须是有效的，可以直接被 \`JSON.parse()\` 解析
3. 不要使用 markdown 代码块包裹，直接输出纯 JSON
4. 数组为空时返回 \`[]\`

## 示例

输入 (JSON):
\`\`\`json
{
  "name": "张三",
  "age": 18,
  "address": {
    "city": "北京",
    "street": "朝阳路"
  }
}
\`\`\`

输出:
[{"name":"name","type":"string","description":"姓名","required":false,"example":"张三"},{"name":"age","type":"number","description":"年龄","required":false,"example":18},{"name":"address","type":"object","description":"地址信息","required":false,"properties":[{"name":"city","type":"string","description":"城市","required":false,"example":"北京"},{"name":"street","type":"string","description":"街道","required":false,"example":"朝阳路"}]}]

---

请立即开始解析。严格按照上述规则，仅输出 JSON 数组格式的解析结果。`;
};

/**
 * 从模型返回的事件中提取文本内容
 */
const extractTextFromEvents = (events: StreamModelGatewayEvent[]): string => {
  if (!Array.isArray(events) || events.length === 0) {
    return '';
  }

  return events
    .filter((event): event is { type: 'text'; text: string } => event.type === 'text' && typeof event.text === 'string')
    .map((event) => event.text)
    .join('');
};

/**
 * 解析模型返回的文本为 SchemaField 数组
 */
const parseSchemaFromText = (text: string): SchemaField[] => {
  if (!text.trim()) {
    return [];
  }

  // 清理文本，移除可能的 markdown 代码块标记
  let cleanedText = text.trim();

  // 移除 markdown 代码块
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.slice(7);
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.slice(3);
  }

  if (cleanedText.endsWith('```')) {
    cleanedText = cleanedText.slice(0, -3);
  }

  cleanedText = cleanedText.trim();

  // 尝试找到 JSON 数组的开始和结束
  const startIndex = cleanedText.indexOf('[');
  const endIndex = cleanedText.lastIndexOf(']');

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    console.error('无法在响应中找到有效的 JSON 数组');
    return [];
  }

  const jsonStr = cleanedText.slice(startIndex, endIndex + 1);

  try {
    const parsed = JSON.parse(jsonStr);

    if (!Array.isArray(parsed)) {
      console.error('解析结果不是数组');
      return [];
    }

    return parsed as SchemaField[];
  } catch (error) {
    console.error('JSON 解析失败:', error);
    return [];
  }
};

/**
 * AI Schema 解析主函数
 * @param request 解析请求，包含文本和类型提示
 * @returns 解析后的 SchemaField 数组
 */
export const aiParseSchema = async (request: ParseSchemaRequest): Promise<SchemaField[]> => {
  const { text, hint = 'json' } = request;

  if (!text.trim()) {
    throw new Error('输入文本不能为空');
  }

  const systemPrompt = buildSchemaParsePrompt(hint);

  const requestBody = {
    messages: [
      {
        role: 'system',
        content: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' } as const,
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `请解析以下 ${hint === 'json' ? 'JSON' : hint === 'typescript' ? 'TypeScript' : '文字描述'}：\n\n${text}`,
          },
        ],
      },
    ],
    temperature: 0.1,
    chat_template_kwargs: {
      enable_thinking: false,
    },
  };

  // 调用模型 API
  const events = await syncModelGateway({ body: requestBody });

  // 提取文本内容
  const responseText = extractTextFromEvents(events);

  if (!responseText) {
    throw new Error('模型未返回有效内容');
  }

  // 解析为 SchemaField 数组
  const schema = parseSchemaFromText(responseText);

  return schema;
};

export default aiParseSchema;

