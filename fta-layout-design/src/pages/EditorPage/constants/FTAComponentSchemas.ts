/**
 * FTA组件属性Schema定义
 * 定义每个组件的可配置属性及其类型
 */

export type PropertyType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'color' 
  | 'select' 
  | 'textarea'
  | 'json';

export interface PropertySchema {
  name: string;
  label: string;
  type: PropertyType;
  required?: boolean;
  defaultValue?: any;
  placeholder?: string;
  options?: { label: string; value: any }[]; // for select type
  description?: string;
}

export interface ComponentSchema {
  component: string;
  properties: PropertySchema[];
}

// 基础原子组件Schema
const Button: ComponentSchema = {
  component: 'Button',
  properties: [
    { name: 'text', label: '按钮文字', type: 'string', required: true, placeholder: '输入按钮文字', defaultValue: '按钮' },
    { 
      name: 'type', 
      label: '按钮类型', 
      type: 'select', 
      options: [
        { label: 'Primary', value: 'primary' },
        { label: 'Default', value: 'default' },
        { label: 'Dashed', value: 'dashed' },
        { label: 'Text', value: 'text' },
        { label: 'Link', value: 'link' },
      ],
      defaultValue: 'default',
    },
    { 
      name: 'size', 
      label: '按钮尺寸', 
      type: 'select', 
      options: [
        { label: 'Large', value: 'large' },
        { label: 'Middle', value: 'middle' },
        { label: 'Small', value: 'small' },
      ],
      defaultValue: 'middle',
    },
    { name: 'disabled', label: '是否禁用', type: 'boolean', defaultValue: false },
    { name: 'loading', label: '加载状态', type: 'boolean', defaultValue: false },
  ],
};

const Icon: ComponentSchema = {
  component: 'Icon',
  properties: [
    { name: 'name', label: '图标名称', type: 'string', required: true, placeholder: '例如: home, user, setting', defaultValue: 'home' },
    { name: 'size', label: '图标大小', type: 'number', defaultValue: 16, placeholder: '单位: px' },
    { name: 'color', label: '图标颜色', type: 'color', placeholder: '例如: rgb(0, 0, 0)' },
  ],
};

const Text: ComponentSchema = {
  component: 'Text',
  properties: [
    { name: 'content', label: '文本内容', type: 'textarea', required: true, placeholder: '输入文本内容', defaultValue: '示例文本' },
    { 
      name: 'type', 
      label: '文本类型', 
      type: 'select', 
      options: [
        { label: 'Default', value: 'default' },
        { label: 'Secondary', value: 'secondary' },
        { label: 'Success', value: 'success' },
        { label: 'Warning', value: 'warning' },
        { label: 'Danger', value: 'danger' },
      ],
    },
    { name: 'fontSize', label: '字体大小', type: 'number', placeholder: '单位: px' },
    { name: 'fontWeight', label: '字体粗细', type: 'number', placeholder: '例如: 400, 500, 600, 700' },
    { name: 'color', label: '字体颜色', type: 'color' },
  ],
};

const Image: ComponentSchema = {
  component: 'Image',
  properties: [
    { name: 'src', label: '图片地址', type: 'string', required: true, placeholder: 'https://...', defaultValue: 'https://placehold.co/300x200' },
    { name: 'alt', label: '图片描述', type: 'string', placeholder: '图片无法显示时的文字' },
    { 
      name: 'fit', 
      label: '填充模式', 
      type: 'select', 
      options: [
        { label: 'Cover', value: 'cover' },
        { label: 'Contain', value: 'contain' },
        { label: 'Fill', value: 'fill' },
        { label: 'None', value: 'none' },
      ],
      defaultValue: 'cover',
    },
  ],
};

const Input: ComponentSchema = {
  component: 'Input',
  properties: [
    { name: 'placeholder', label: '占位文字', type: 'string', placeholder: '请输入...' },
    { 
      name: 'type', 
      label: '输入框类型', 
      type: 'select', 
      options: [
        { label: 'Text', value: 'text' },
        { label: 'Password', value: 'password' },
        { label: 'Number', value: 'number' },
        { label: 'Email', value: 'email' },
      ],
      defaultValue: 'text',
    },
    { name: 'disabled', label: '是否禁用', type: 'boolean', defaultValue: false },
    { name: 'maxLength', label: '最大长度', type: 'number' },
  ],
};

// 容器组件Schema
const Container: ComponentSchema = {
  component: 'Container',
  properties: [
    { name: 'backgroundColor', label: '背景颜色', type: 'color' },
    { name: 'padding', label: '内边距', type: 'string', placeholder: '例如: 16px 或 16px 20px' },
  ],
};

const Flex: ComponentSchema = {
  component: 'Flex',
  properties: [
    { 
      name: 'direction', 
      label: 'Flex方向', 
      type: 'select', 
      options: [
        { label: 'Row', value: 'row' },
        { label: 'Column', value: 'column' },
      ],
      defaultValue: 'row',
    },
    { 
      name: 'align', 
      label: '对齐方式', 
      type: 'select', 
      options: [
        { label: 'Flex Start', value: 'flex-start' },
        { label: 'Center', value: 'center' },
        { label: 'Flex End', value: 'flex-end' },
        { label: 'Stretch', value: 'stretch' },
      ],
    },
    { 
      name: 'justify', 
      label: '主轴对齐', 
      type: 'select', 
      options: [
        { label: 'Flex Start', value: 'flex-start' },
        { label: 'Center', value: 'center' },
        { label: 'Flex End', value: 'flex-end' },
        { label: 'Space Between', value: 'space-between' },
        { label: 'Space Around', value: 'space-around' },
      ],
    },
    { name: 'gap', label: '间距', type: 'number', placeholder: '单位: px' },
  ],
};

const Card: ComponentSchema = {
  component: 'Card',
  properties: [
    { name: 'title', label: '卡片标题', type: 'string', placeholder: '输入卡片标题' },
    { name: 'bordered', label: '是否有边框', type: 'boolean', defaultValue: true },
    { name: 'hoverable', label: '鼠标悬停效果', type: 'boolean', defaultValue: false },
  ],
};

// Schema映射表
export const FTA_COMPONENT_SCHEMAS: Record<string, ComponentSchema> = {
  // 基础原子组件
  Button,
  Icon,
  Text,
  Image,
  Input,
  Avatar: {
    component: 'Avatar',
    properties: [
      { name: 'src', label: '头像图片', type: 'string', placeholder: 'https://...' },
      { 
        name: 'size', 
        label: '头像大小', 
        type: 'select', 
        options: [
          { label: 'Large', value: 'large' },
          { label: 'Default', value: 'default' },
          { label: 'Small', value: 'small' },
        ],
        defaultValue: 'default',
      },
      { 
        name: 'shape', 
        label: '头像形状', 
        type: 'select', 
        options: [
          { label: 'Circle', value: 'circle' },
          { label: 'Square', value: 'square' },
        ],
        defaultValue: 'circle',
      },
    ],
  },
  Badge: {
    component: 'Badge',
    properties: [
      { name: 'count', label: '徽标数', type: 'number', defaultValue: 0 },
      { name: 'dot', label: '显示小红点', type: 'boolean', defaultValue: false },
      { name: 'color', label: '徽标颜色', type: 'color' },
    ],
  },
  Tag: {
    component: 'Tag',
    properties: [
      { name: 'text', label: '标签文字', type: 'string', required: true, defaultValue: '标签' },
      { name: 'color', label: '标签颜色', type: 'color' },
      { name: 'closable', label: '可关闭', type: 'boolean', defaultValue: false },
    ],
  },
  
  // 容器组件
  Container,
  Flex,
  Grid: {
    component: 'Grid',
    properties: [
      { name: 'columns', label: '列数', type: 'number', defaultValue: 12 },
      { name: 'gap', label: '间距', type: 'number', placeholder: '单位: px' },
    ],
  },
  
  // 复杂组件
  Card,
  ListItem: {
    component: 'ListItem',
    properties: [
      { name: 'title', label: '列表项标题', type: 'string', placeholder: '输入标题' },
      { name: 'description', label: '列表项描述', type: 'textarea', placeholder: '输入描述' },
    ],
  },
  Modal: {
    component: 'Modal',
    properties: [
      { name: 'title', label: '弹窗标题', type: 'string', placeholder: '输入标题' },
      { name: 'width', label: '弹窗宽度', type: 'number', defaultValue: 520 },
      { name: 'closable', label: '显示关闭按钮', type: 'boolean', defaultValue: true },
    ],
  },
  
  // 通用组件 - 无特定属性或使用JSON自定义
  Toggle: {
    component: 'Toggle',
    properties: [
      { name: 'checked', label: '是否选中', type: 'boolean', defaultValue: false },
      { name: 'disabled', label: '是否禁用', type: 'boolean', defaultValue: false },
    ],
  },
  Radio: {
    component: 'Radio',
    properties: [
      { name: 'options', label: '选项列表', type: 'json', placeholder: '[{"label": "选项1", "value": "1"}]' },
    ],
  },
  
  // 默认 - 没有预定义schema的组件
  _default: {
    component: '_default',
    properties: [],
  },
};

/**
 * 获取组件的属性Schema
 */
export function getComponentSchema(componentName: string): ComponentSchema {
  return FTA_COMPONENT_SCHEMAS[componentName] || FTA_COMPONENT_SCHEMAS._default;
}
