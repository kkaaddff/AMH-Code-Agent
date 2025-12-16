import type { DataModel } from '@/types/dataModel';
import { DatabaseOutlined } from '@ant-design/icons';
import { Button, Cascader, Divider, Form, Input, InputNumber, Select, Space, Switch, Tooltip, Typography } from 'antd';
import type { DefaultOptionType } from 'antd/es/cascader';
import React from 'react';
import { FTA_COMPONENTS } from '../../constants/FTAComponents';
import { getComponentSchema, PropertySchema } from '../../constants/FTAComponentSchemas';

const { Text } = Typography;
const { TextArea } = Input;
const { OptGroup, Option } = Select;

// 自定义搜索过滤函数，支持模糊匹配和优先级排序
export const customFilterOption = (input: string, option: any) => {
  if (!input || !option?.children) return false;

  const componentName = option.children as string;
  const searchTerms = input.toLowerCase().trim();

  if (componentName.toLowerCase() === searchTerms) return true;
  if (componentName.toLowerCase().startsWith(searchTerms)) return true;

  const searchChars = searchTerms.split('');
  let componentIndex = 0;
  let searchIndex = 0;

  while (componentIndex < componentName.length && searchIndex < searchChars.length) {
    if (componentName[componentIndex].toLowerCase() === searchChars[searchIndex]) {
      searchIndex++;
    }
    componentIndex++;
  }

  if (searchIndex === searchChars.length) return true;
  if (componentName.toLowerCase().includes(searchTerms)) return true;

  return false;
};

// ============ FTA 组件类型选择器 ============
interface FTAComponentSelectProps {
  recentComponents: string[];
  onChange?: (value: string) => void;
  disabled?: boolean;
  /** 额外的 label 内容（如快速创建按钮） */
  labelExtra?: React.ReactNode;
}

export const FTAComponentSelectField: React.FC<FTAComponentSelectProps> = ({
  recentComponents,
  onChange,
  disabled,
  labelExtra,
}) => {
  return (
    <Form.Item
      label={
        labelExtra ? (
          <Space>
            <Text>FTA 组件类型</Text>
            {labelExtra}
          </Space>
        ) : (
          'FTA 组件类型'
        )
      }
      name='ftaComponent'
      rules={[{ required: true, message: '请选择组件类型' }]}>
      <Select
        placeholder='选择组件类型'
        showSearch
        filterOption={customFilterOption}
        disabled={disabled}
        onChange={onChange}>
        {recentComponents.length > 0 && (
          <OptGroup key='最近选择' label='最近选择'>
            {recentComponents.map((comp) => (
              <Option key={`recent-${comp}`} value={comp}>
                {comp}
              </Option>
            ))}
          </OptGroup>
        )}
        {Object.entries(FTA_COMPONENTS).map(([groupName, components]) => (
          <OptGroup key={groupName} label={groupName}>
            {components.map((comp) => (
              <Option key={comp} value={comp}>
                {comp}
              </Option>
            ))}
          </OptGroup>
        ))}
      </Select>
    </Form.Item>
  );
};

// ============ 基本信息字段（名称 + 说明） ============
interface BasicInfoFieldsProps {
  /** placeholder 后缀，如 "（可选）" */
  optionalSuffix?: boolean;
}

export const BasicInfoFields: React.FC<BasicInfoFieldsProps> = ({ optionalSuffix = false }) => {
  const suffix = optionalSuffix ? '（可选）' : '';
  return (
    <>
      <Form.Item label='组件名称' name='name'>
        <Input placeholder={`输入组件实例名称${suffix}`} />
      </Form.Item>
      <Form.Item label='组件说明' name='comment'>
        <TextArea rows={2} placeholder={`输入组件说明或备注${suffix}`} />
      </Form.Item>
    </>
  );
};

// ============ 动态属性字段渲染 ============
interface DynamicPropertyFieldsProps {
  componentName: string;
  /** 是否显示分隔线标题 */
  showDivider?: boolean;
}

export const DynamicPropertyFields: React.FC<DynamicPropertyFieldsProps> = ({ componentName, showDivider = true }) => {
  if (!componentName) return null;

  const schema = getComponentSchema(componentName);

  if (!schema || schema.properties.length === 0) {
    return (
      <>
        {showDivider && (
          <Divider orientation='left' style={{ margin: '16px 0' }}>
            <Text strong>组件属性</Text>
          </Divider>
        )}
        <div className='component-property-panel-dynamic-properties-hint'>
          <Text type='secondary'>该组件暂无预定义属性，可在创建后通过属性面板编辑</Text>
        </div>
      </>
    );
  }

  return (
    <>
      {showDivider && (
        <Divider orientation='left' style={{ margin: '16px 0' }}>
          <Text strong>组件属性</Text>
        </Divider>
      )}
      {schema.properties.map((prop: PropertySchema) => {
        const defaultValue = prop.defaultValue;
        const commonProps = {
          label: prop.label,
          name: prop.name,
          rules: prop.required ? [{ required: true, message: `请输入${prop.label}` }] : undefined,
          initialValue: defaultValue,
          help: prop.description,
        };

        switch (prop.type) {
          case 'string':
            return (
              <Form.Item key={prop.name} {...commonProps}>
                <Input placeholder={prop.placeholder} />
              </Form.Item>
            );
          case 'number':
            return (
              <Form.Item key={prop.name} {...commonProps}>
                <InputNumber style={{ width: '100%' }} placeholder={prop.placeholder} />
              </Form.Item>
            );
          case 'boolean':
            return (
              <Form.Item key={prop.name} {...commonProps} valuePropName='checked'>
                <Switch />
              </Form.Item>
            );
          case 'select':
            return (
              <Form.Item key={prop.name} {...commonProps}>
                <Select placeholder={prop.placeholder || `选择${prop.label}`} options={prop.options} allowClear />
              </Form.Item>
            );
          case 'color':
          case 'textarea':
          case 'json':
            const Component = prop.type === 'color' ? Input : TextArea;
            const rows = prop.type === 'textarea' ? 3 : 4;
            return (
              <Form.Item key={prop.name} {...commonProps}>
                <Component
                  rows={rows}
                  placeholder={prop.placeholder || (prop.type === 'json' ? '输入JSON格式数据' : '')}
                />
              </Form.Item>
            );
          default:
            return null;
        }
      })}
    </>
  );
};

// ============ 数据模型绑定字段 ============
interface DataModelBindingFieldProps {
  cascaderOptions: DefaultOptionType[];
  dataModelsList: DataModel[];
  /** 是否显示分隔线标题 */
  showDivider?: boolean;
  /** 分隔线方向，仅在 showDivider 为 true 时生效 */
  dividerOrientation?: 'left' | 'center' | 'right';
}

export const DataModelBindingField: React.FC<DataModelBindingFieldProps> = ({
  cascaderOptions,
  dataModelsList,
  showDivider = true,
  dividerOrientation = 'left',
}) => {
  return (
    <>
      {showDivider && (
        <Divider orientation={dividerOrientation} style={{ margin: '16px 0' }}>
          <Space size={4}>
            <DatabaseOutlined />
            <Text strong>数据绑定</Text>
          </Space>
        </Divider>
      )}
      <Form.Item
        label='关联数据模型'
        name='dataModelId'
        extra='选择要绑定的数据模型，用于代码生成时关联数据结构'
        getValueFromEvent={(value: string[]) => {
          return value && value.length > 1 ? value[1] : undefined;
        }}
        getValueProps={(value) => {
          if (!value) return { value: undefined };
          const model = dataModelsList.find((m) => m.id === value);
          if (!model) return { value: undefined };
          const groupKey = model.groupId || '__ungrouped__';
          return { value: [groupKey, value] };
        }}>
        <Cascader
          options={cascaderOptions}
          placeholder='选择分组 → 数据模型'
          allowClear
          showSearch={{
            filter: (inputValue, path) => {
              return path.some(
                (option) =>
                  (option.label as string).toLowerCase().includes(inputValue.toLowerCase()) ||
                  (option.description as string | undefined)?.toLowerCase().includes(inputValue.toLowerCase())
              );
            },
          }}
          displayRender={(labels, selectedOptions) => {
            if (!selectedOptions || selectedOptions.length < 2) return '';
            const model = selectedOptions[1];
            return (
              <Tooltip title={model.description}>
                <span>
                  {labels[0]} / <strong>{labels[1]}</strong>
                </span>
              </Tooltip>
            );
          }}
          expandTrigger='hover'
          notFoundContent={cascaderOptions.length === 0 ? '暂无数据模型，请先在左侧面板添加' : '没有匹配的数据模型'}
          style={{ width: '100%' }}
        />
      </Form.Item>
    </>
  );
};
