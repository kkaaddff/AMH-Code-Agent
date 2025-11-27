import { Inject, Provide } from '@midwayjs/decorator';
import { ModelGatewayService } from '../common/model-gateway';
import type { SchemaField } from '@fta/shared-types';

/**
 * Schema 解析服务
 * 使用大模型将文本解析为结构化的 Schema 定义
 */
@Provide()
export class SchemaParserService {
  @Inject()
  private modelGateway: ModelGatewayService;

  private buildPrompt(text: string, hint?: 'json' | 'typescript' | 'text'): string {
    const hintText = hint === 'json' ? 'JSON 格式' : hint === 'typescript' ? 'TypeScript 类型定义' : '自然语言描述';

    return `你是一个数据结构分析专家。请分析以下${hintText}，并将其转换为标准的 Schema 字段定义数组。

输入内容：
\`\`\`
${text}
\`\`\`

请严格按照以下 JSON 格式输出 Schema 字段数组，不要输出任何其他内容：
[
  {
    "name": "字段名",
    "type": "string|number|boolean|object|array",
    "description": "字段描述",
    "required": true或false,
    "properties": [子字段数组，仅当type为object时],
    "items": {元素类型定义，仅当type为array时}
  }
]

注意事项：
1. type 只能是: string, number, boolean, object, array 五种之一
2. 对于嵌套对象，使用 properties 字段定义子字段
3. 对于数组类型，使用 items 字段定义数组元素的类型
4. 根据上下文推断 required 是否为 true
5. 为每个字段添加简洁的中文描述
6. 只输出 JSON 数组，不要输出其他任何文字

输出：`;
  }

  /**
   * 解析文本为 Schema
   */
  async parseText(text: string, hint?: 'json' | 'typescript' | 'text'): Promise<SchemaField[]> {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const prompt = this.buildPrompt(text.trim(), hint);

    const response = await this.modelGateway.callModel({
      prompt,
      temperature: 0.1,
    });

    if (!response.success || !response.content) {
      throw new Error(response.error || '模型调用失败');
    }

    // 提取 JSON 内容
    const content = response.content.trim();
    let jsonContent = content;

    // 尝试提取 code block 中的 JSON
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonContent = codeBlockMatch[1].trim();
    }

    // 尝试找到 JSON 数组
    const arrayMatch = jsonContent.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      jsonContent = arrayMatch[0];
    }

    try {
      const parsed = JSON.parse(jsonContent);
      if (!Array.isArray(parsed)) {
        throw new Error('解析结果不是数组格式');
      }
      return this.normalizeSchema(parsed);
    } catch (parseError) {
      console.error('[SchemaParser] JSON 解析失败:', parseError, '\n原始内容:', content);
      throw new Error('无法解析模型返回的 Schema，请检查输入格式');
    }
  }

  /**
   * 标准化 Schema 字段
   */
  private normalizeSchema(fields: any[]): SchemaField[] {
    return fields.map((field) => this.normalizeField(field));
  }

  private normalizeField(field: any): SchemaField {
    const validTypes = ['string', 'number', 'boolean', 'object', 'array'];
    const type = validTypes.includes(field.type) ? field.type : 'string';

    const normalized: SchemaField = {
      name: String(field.name || ''),
      type: type as SchemaField['type'],
      description: field.description ? String(field.description) : undefined,
      required: Boolean(field.required),
    };

    if (field.enum && Array.isArray(field.enum)) {
      normalized.enum = field.enum.map(String);
    }

    if (field.example !== undefined) {
      normalized.example = field.example;
    }

    if (type === 'object' && field.properties && Array.isArray(field.properties)) {
      normalized.properties = this.normalizeSchema(field.properties);
    }

    if (type === 'array' && field.items) {
      normalized.items = this.normalizeField(field.items);
    }

    return normalized;
  }
}
