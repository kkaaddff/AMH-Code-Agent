/**
 * AI TypeScript Interface 生成服务
 * 将 prompt 和结构处理逻辑放在前端，通过 model-gateway-sync 调用统一大模型
 */

import { syncModelGateway, StreamModelGatewayEvent } from '../utils/modelGateway';

export interface ParseTypeScriptRequest {
  /** 输入文本（JSON、TypeScript 或自然语言描述） */
  text: string;
  /** 输入类型提示 */
  hint?: 'json' | 'typescript' | 'text';
  /** 接口名称（可选，如果不提供则从输入中推断） */
  interfaceName?: string;
}

/**
 * 构建 AI TypeScript Interface 生成的 prompt
 */
const buildTypeScriptParsePrompt = (hint: 'json' | 'typescript' | 'text', interfaceName?: string): string => {
  const hintDescription = {
    json: 'JSON 数据格式',
    typescript: 'TypeScript 类型定义',
    text: '自然语言描述',
  }[hint];

  const nameHint = interfaceName
    ? `接口名称应为：\`${interfaceName}\``
    : '请根据输入内容推断合适的接口名称（使用 PascalCase 命名）';

  return `## 角色：TypeScript 类型定义专家

你是一个专业的 TypeScript 类型定义专家，擅长从各种格式的输入中生成标准、规范的 TypeScript 接口定义。

## 核心任务

分析用户提供的 **${hintDescription}** 输入，将其转换为标准的 TypeScript 接口定义。

## 输出格式

你的输出**必须**是有效的 TypeScript 代码，包含一个或多个 interface 定义。${nameHint}

## 生成规则

### 1. 类型映射
- JSON 中的 \`string\` → \`string\`
- JSON 中的 \`number\`/\`integer\` → \`number\`
- JSON 中的 \`boolean\` → \`boolean\`
- JSON 中的嵌套对象 \`{}\` → 嵌套的 interface 或内联对象类型
- JSON 中的数组 \`[]\` → \`Array<ElementType>\` 或 \`ElementType[]\`
- JSON 中的 \`null\` → 使用联合类型，如 \`string | null\`

### 2. 字段命名规范
- 保持原始字段名的命名风格（camelCase、snake_case 等）
- 如果是自然语言描述，推断合理的英文字段名（使用 camelCase）

### 3. 可选字段
- 如果输入中明确标注了 "必填"、"required" 等，字段为必填（不加 \`?\`）
- 如果输入中明确标注了 "可选"、"optional" 等，字段为可选（加 \`?\`）
- 从 JSON 示例中无法判断时，默认设为可选（加 \`?\`）

### 4. 注释和文档
- 为每个字段添加 JSDoc 注释，说明字段的用途
- 从字段名和示例值推断合理的描述
- 如果有枚举值，在注释中说明

### 5. 嵌套结构处理
- 对于嵌套对象，优先创建独立的 interface
- 如果嵌套结构简单且只使用一次，可以使用内联对象类型
- 为嵌套的 interface 使用有意义的名称

### 6. 数组类型
- 使用 \`Array<Type>\` 或 \`Type[]\` 格式
- 为数组元素类型创建合适的 interface（如果元素是对象）

## 输出要求

1. **只输出 TypeScript 代码**，不要包含任何其他文字、标题或说明
2. 代码必须是有效的 TypeScript，可以直接被 TypeScript 编译器解析
3. 不要使用 markdown 代码块包裹，直接输出纯 TypeScript 代码
4. 使用 2 个空格缩进
5. 每个 interface 之间用空行分隔
6. 确保所有类型都是明确的，避免使用 \`any\`

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
\`\`\`typescript
interface Address {
  /** 城市 */
  city: string;
  /** 街道 */
  street: string;
}

interface User {
  /** 姓名 */
  name: string;
  /** 年龄 */
  age: number;
  /** 地址信息 */
  address?: Address;
}
\`\`\`

---

请立即开始生成。严格按照上述规则，仅输出 TypeScript 代码。`;
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
 * 清理模型返回的 TypeScript 代码
 * 移除可能的 markdown 代码块标记和其他非代码内容
 */
const cleanTypeScriptCode = (text: string): string => {
  if (!text.trim()) {
    return '';
  }

  let cleanedText = text.trim();

  // 移除 markdown 代码块标记
  const codeBlockPatterns = [/^```typescript\s*\n?/i, /^```ts\s*\n?/i, /^```\s*\n?/, /\n?```\s*$/];

  codeBlockPatterns.forEach((pattern) => {
    cleanedText = cleanedText.replace(pattern, '');
  });

  cleanedText = cleanedText.trim();

  // 尝试找到第一个 interface 或 type 关键字的位置
  const interfaceIndex = cleanedText.indexOf('interface ');
  const typeIndex = cleanedText.indexOf('type ');
  const startIndex = interfaceIndex !== -1 ? interfaceIndex : typeIndex !== -1 ? typeIndex : 0;

  if (startIndex > 0) {
    cleanedText = cleanedText.slice(startIndex);
  }

  // 移除末尾可能的非代码内容（如解释性文字）
  // 查找最后一个 } 或 ; 的位置
  const lastBraceIndex = cleanedText.lastIndexOf('}');
  const lastSemicolonIndex = cleanedText.lastIndexOf(';');
  const endIndex = Math.max(lastBraceIndex, lastSemicolonIndex);

  if (endIndex !== -1 && endIndex < cleanedText.length - 10) {
    // 如果最后一个 } 或 ; 之后还有较多内容，可能是解释性文字，截断
    cleanedText = cleanedText.slice(0, endIndex + 1);
  }

  return cleanedText.trim();
};

/**
 * AI TypeScript Interface 生成主函数
 * @param request 解析请求，包含文本、类型提示和可选的接口名称
 * @returns 生成的 TypeScript 接口代码字符串
 */
export const aiParseTypeScript = async (request: ParseTypeScriptRequest): Promise<string> => {
  const { text, hint = 'json', interfaceName } = request;

  if (!text.trim()) {
    throw new Error('输入文本不能为空');
  }

  const systemPrompt = buildTypeScriptParsePrompt(hint, interfaceName);

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
            text: `请生成以下 ${
              hint === 'json' ? 'JSON' : hint === 'typescript' ? 'TypeScript' : '文字描述'
            } 对应的 TypeScript 接口定义：\n\n${text}`,
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

  // 清理并返回 TypeScript 代码
  const cleanedCode = cleanTypeScriptCode(responseText);

  if (!cleanedCode) {
    throw new Error('未能从模型响应中提取有效的 TypeScript 代码');
  }

  return cleanedCode;
};

// 为了向后兼容，保留旧的函数名（已废弃）
/**
 * @deprecated 请使用 aiParseTypeScript 代替
 */
export const aiParseSchema = async (request: {
  text: string;
  hint?: 'json' | 'typescript' | 'text';
}): Promise<string> => {
  return aiParseTypeScript(request);
};

export default aiParseTypeScript;
