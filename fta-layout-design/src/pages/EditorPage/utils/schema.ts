import { SchemaField } from '@/types/dataModel';

/**
 * 校验 SchemaField 数据结构是否有效
 */
export const validateSchemaField = (field: any): field is SchemaField => {
  if (!field || typeof field !== 'object') return false;
  if (typeof field.name !== 'string') return false;
  if (!['string', 'number', 'boolean', 'object', 'array'].includes(field.type)) return false;

  // 校验嵌套 object 的 properties
  if (field.type === 'object' && field.properties) {
    if (!Array.isArray(field.properties)) return false;
    for (const prop of field.properties) {
      if (!validateSchemaField(prop)) return false;
    }
  }

  // 校验 array 的 items
  if (field.type === 'array' && field.items) {
    if (!validateSchemaField(field.items)) return false;
  }

  return true;
};

/**
 * 校验整个 schema 数组
 */
export const validateSchema = (schema: any): schema is SchemaField[] => {
  if (!Array.isArray(schema)) return false;
  return schema.every(validateSchemaField);
};
