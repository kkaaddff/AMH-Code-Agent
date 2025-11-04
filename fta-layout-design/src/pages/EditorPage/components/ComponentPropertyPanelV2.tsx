import { DSLNode } from '@/types/dsl';
import { CopyOutlined, DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Checkbox,
  Divider,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Typography,
} from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useSnapshot } from 'valtio';

import { FTA_COMPONENTS } from '../constants/FTAComponents';
import { getComponentSchema, PropertySchema } from '../constants/FTAComponentSchemas';
import {
  calculateDSLNodeAbsolutePosition,
  componentDetectionActions,
  componentDetectionStore,
  findAnnotationByDSLNodeId,
  findAnnotationById,
  findDSLNodeById,
} from '../contexts/ComponentDetectionContextV2';
import { NodeType } from '../types/componentDetectionV2';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { OptGroup, Option } = Select;

// 自定义搜索过滤函数，支持模糊匹配和优先级排序
const customFilterOption = (input: string, option: any) => {
  if (!input || !option?.children) return false;

  const componentName = option.children as string;
  const searchTerms = input.toLowerCase().trim();

  // 如果完全匹配组件名，优先级最高
  if (componentName.toLowerCase() === searchTerms) {
    return true;
  }

  // 如果组件名以搜索词开头，优先级较高
  if (componentName.toLowerCase().startsWith(searchTerms)) {
    return true;
  }

  // 拆分搜索词为单个字符，检查是否都能按顺序在组件名中找到
  const searchChars = searchTerms.split('');
  let componentIndex = 0;
  let searchIndex = 0;

  while (componentIndex < componentName.length && searchIndex < searchChars.length) {
    if (componentName[componentIndex].toLowerCase() === searchChars[searchIndex]) {
      searchIndex++;
    }
    componentIndex++;
  }

  // 如果所有搜索字符都能按顺序匹配到，则显示
  if (searchIndex === searchChars.length) {
    return true;
  }

  // 检查是否包含完整的搜索词
  if (componentName.toLowerCase().includes(searchTerms)) {
    return true;
  }

  return false;
};

const ComponentPropertyPanelV2: React.FC = () => {
  const { message, modal } = App.useApp();
  const { selectedAnnotationId, selectedDSLNodeId, selectedNodeIds } = useSnapshot(componentDetectionStore);
  const [form] = Form.useForm();
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedFTAComponent, setSelectedFTAComponent] = useState<string>('');

  // 获取选中的标注
  const selectedAnnotation = useMemo(() => {
    if (!selectedAnnotationId) return null;
    return findAnnotationById(selectedAnnotationId);
  }, [selectedAnnotationId]);

  // 获取选中的DSL节点（用于创建新标注）
  const selectedDSLNode = useMemo(() => {
    if (!selectedDSLNodeId || selectedAnnotation) return null;
    return componentDetectionActions.getSelectedDSLNode();
  }, [selectedDSLNodeId, selectedAnnotation]);

  // 初始化表单值
  useEffect(() => {
    if (selectedAnnotation) {
      form.setFieldsValue({
        ftaComponent: selectedAnnotation.ftaComponent,
        name: selectedAnnotation.name || '',
        comment: selectedAnnotation.comment || '',
        // Layout properties
        width: selectedAnnotation.layout?.width || selectedAnnotation.width,
        height: selectedAnnotation.layout?.height || selectedAnnotation.height,
        position: selectedAnnotation.layout?.position || 'relative',
        flexDirection: selectedAnnotation.layout?.flexDirection,
        alignItems: selectedAnnotation.layout?.alignItems,
        justifyContent: selectedAnnotation.layout?.justifyContent,
        flex: selectedAnnotation.layout?.flex,
        gap: selectedAnnotation.layout?.gap,
        padding: selectedAnnotation.layout?.padding,
        margin: selectedAnnotation.layout?.margin,
        backgroundColor: selectedAnnotation.layout?.backgroundColor,
        borderRadius: selectedAnnotation.layout?.borderRadius,
        // Props
        props: JSON.stringify(selectedAnnotation.props || {}, null, 2),
      });
      setHasChanges(false);
    } else {
      form.resetFields();
      setHasChanges(false);
    }
  }, [selectedAnnotation, form]);

  // 处理表单值变化
  const handleValuesChange = () => {
    setHasChanges(true);
  };

  // 处理保存
  const handleSave = async () => {
    if (!selectedAnnotation) return;

    try {
      const values = await form.validateFields();

      // Parse props JSON
      let props = {};
      try {
        if (values.props) {
          props = JSON.parse(values.props);
        }
      } catch (error) {
        message.error('组件属性 JSON 格式错误');
        return;
      }

      // Update annotation
      const updated = await componentDetectionActions.updateAnnotation(selectedAnnotation.id, {
        ftaComponent: values.ftaComponent,
        name: values.name,
        comment: values.comment,
        layout: {
          width: values.width,
          height: values.height,
          position: values.position,
          flexDirection: values.flexDirection,
          alignItems: values.alignItems,
          justifyContent: values.justifyContent,
          flex: values.flex,
          gap: values.gap,
          padding: values.padding,
          margin: values.margin,
          backgroundColor: values.backgroundColor,
          borderRadius: values.borderRadius,
        },
        props,
      });

      if (updated) {
        setHasChanges(false);
        message.success('保存成功');
      } else {
        message.info('已取消更新');
      }
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  // 处理删除
  const handleDelete = () => {
    if (!selectedAnnotation || selectedAnnotation.isRoot) return;

    let deleteChildren = false;
    modal.confirm({
      title: '删除标注',
      content: (
        <Space direction='vertical' size={4}>
          <span>
            确定要删除标注 "{selectedAnnotation.ftaComponent}
            {selectedAnnotation.name ? ` (${selectedAnnotation.name})` : ''}" 吗？
          </span>
          <Checkbox
            onChange={(e) => {
              deleteChildren = e.target.checked;
            }}>
            同时删除所有子标注
          </Checkbox>
          <Text type='secondary' style={{ fontSize: 12 }}>
            不勾选时仅删除当前标注，子标注将自动提升一级
          </Text>
        </Space>
      ),
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        componentDetectionActions.deleteAnnotation(selectedAnnotation.id, { deleteChildren });
        message.success('已删除标注');
      },
    });
  };

  // 检测是否为多选状态
  const isMultiSelection = useMemo(() => selectedNodeIds.length > 1, [selectedNodeIds]);

  // 分别统计已标注和未标注节点数量
  const selectedAnnotationCount = useMemo(
    () => selectedNodeIds.filter((item) => item.type === NodeType.ANNOTATION).length,
    [selectedNodeIds]
  );

  const selectedDSLNodeCount = useMemo(
    () => selectedNodeIds.filter((item) => item.type === NodeType.DSL).length,
    [selectedNodeIds]
  );

  const totalSelectedCount = selectedNodeIds.length;

  const selectionBounds = useMemo(() => {
    if (!isMultiSelection) return [];

    const bounds: Array<{ id: string; x: number; y: number; width: number; height: number }> = [];

    selectedNodeIds.forEach((item) => {
      if (item.type === NodeType.ANNOTATION) {
        const annotation = findAnnotationById(item.id);
        if (!annotation) return;
        bounds.push({
          id: item.id,
          x: annotation.absoluteX,
          y: annotation.absoluteY,
          width: annotation.width,
          height: annotation.height,
        });
      } else if (item.type === NodeType.DSL) {
        const node = findDSLNodeById(item.id);
        if (!node) return;
        const { x, y } = calculateDSLNodeAbsolutePosition(node);
        bounds.push({
          id: item.id,
          x,
          y,
          width: node.layoutStyle?.width || 0,
          height: node.layoutStyle?.height || 0,
        });
      }
    });

    return bounds;
  }, [isMultiSelection, selectedNodeIds]);

  const hasSelectionCollision = useMemo(() => {
    if (selectionBounds.length < 2) return false;

    for (let i = 0; i < selectionBounds.length; i += 1) {
      const a = selectionBounds[i];
      const ax2 = a.x + (a.width || 0);
      const ay2 = a.y + (a.height || 0);

      for (let j = i + 1; j < selectionBounds.length; j += 1) {
        const b = selectionBounds[j];
        const bx2 = b.x + (b.width || 0);
        const by2 = b.y + (b.height || 0);

        const separated =
          ax2 <= b.x || // a 在 b 左侧
          bx2 <= a.x || // b 在 a 左侧
          ay2 <= b.y || // a 在 b 上方
          by2 <= a.y; // b 在 a 上方

        if (!separated) {
          return true;
        }
      }
    }

    return false;
  }, [selectionBounds]);

  const batchTargetDSLNodes = useMemo(() => {
    if (!isMultiSelection) return [];

    const nodes: DSLNode[] = [];

    selectedNodeIds.forEach((item) => {
      if (item.type !== NodeType.DSL) return;
      const node = findDSLNodeById(item.id);
      if (!node) return;
      const alreadyAnnotated = !!findAnnotationByDSLNodeId(node.id);
      if (alreadyAnnotated) return;
      nodes.push(node);
    });

    return nodes;
  }, [isMultiSelection, selectedNodeIds]);

  const canBatchCreate = isMultiSelection && !hasSelectionCollision && batchTargetDSLNodes.length > 0;

  // 处理创建标注
  const handleCreateAnnotation = async () => {
    try {
      const values = await form.validateFields();
      const ftaComponent = values.ftaComponent;
      let shouldResetForm = false;

      if (isMultiSelection) {
        const combined = componentDetectionActions.combineSelectedDSLNodes(ftaComponent);
        if (combined) {
          message.success('已创建组合标注');
          shouldResetForm = true;
        } else {
          message.info('未创建组合标注');
        }
      } else if (selectedDSLNode) {
        const { ftaComponent: _, name, comment, ...componentProps } = values;
        const created = await componentDetectionActions.createAnnotation(selectedDSLNode, ftaComponent, {
          name,
          comment,
          props: componentProps,
        });

        if (created) {
          message.success('已创建标注');
          shouldResetForm = true;
        }
      }

      if (shouldResetForm) {
        form.resetFields();
        setSelectedFTAComponent('');
      }
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleBatchCreateAnnotations = async () => {
    try {
      const values = await form.validateFields();
      if (batchTargetDSLNodes.length === 0) {
        message.warning('没有可批量创建的节点');
        return;
      }

      const { ftaComponent, name, comment, ...componentProps } = values;

      let createdCount = 0;
      for (const dslNode of batchTargetDSLNodes) {
        const created = await componentDetectionActions.createAnnotation(dslNode, ftaComponent, {
          name,
          comment,
          props: componentProps,
        });
        if (created) {
          createdCount += 1;
        }
      }

      const cancelledCount = batchTargetDSLNodes.length - createdCount;
      const skippedCount = selectedDSLNodeCount - batchTargetDSLNodes.length;

      const messageParts: string[] = [];
      if (createdCount > 0) {
        messageParts.push(`已为 ${createdCount} 个节点创建标注`);
      }
      if (cancelledCount > 0) {
        messageParts.push(`${cancelledCount} 个节点取消创建`);
      }
      if (skippedCount > 0) {
        messageParts.push(`${skippedCount} 个节点已存在标注被跳过`);
      }

      if (createdCount > 0) {
        message.success(messageParts.join('，'));
        form.resetFields();
        setSelectedFTAComponent('');
      } else {
        message.info(messageParts.join('，') || '未创建任何标注');
      }
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  // 当组件类型发生变化时，填充动态属性的默认值
  useEffect(() => {
    if (selectedAnnotation) return;
    if (!selectedFTAComponent) return;
    if (!isMultiSelection && !selectedDSLNode) return;

    const schema = getComponentSchema(selectedFTAComponent);
    if (!schema) return;

    const defaultValues = schema.properties.reduce<Record<string, unknown>>((acc, prop) => {
      const defaultValue = prop.defaultValue;
      if (defaultValue !== undefined) {
        acc[prop.name] = defaultValue;
      }
      return acc;
    }, {});

    if (Object.keys(defaultValues).length > 0) {
      form.setFieldsValue(defaultValues);
    }
  }, [selectedAnnotation, selectedFTAComponent, form, isMultiSelection, selectedDSLNode]);

  // 全局快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter: 创建标注
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();

        // 校验：必须是创建状态（有选中的DSL节点或多选状态），且不是编辑现有标注
        if (selectedAnnotation) {
          return;
        }

        if (!isMultiSelection && !selectedDSLNodeId) {
          message.warning('请先选择一个节点');
          return;
        }

        handleCreateAnnotation();
      }

      // Cmd/Ctrl + Delete: 删除标注
      if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace') {
        e.preventDefault();

        // 校验：必须有选中的标注，且不是根节点
        if (!selectedAnnotation) {
          message.warning('请先选择一个标注');
          return;
        }

        if (selectedAnnotation.isRoot) {
          message.warning('根节点不可删除');
          return;
        }

        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedAnnotation, selectedAnnotationId, selectedDSLNodeId, isMultiSelection, message]);

  // 渲染动态属性字段
  const renderDynamicPropertyFields = (componentName: string) => {
    if (!componentName) return null;

    const schema = getComponentSchema(componentName);

    if (!schema || schema.properties.length === 0) {
      return (
        <div style={{ padding: '12px', background: 'rgb(245, 245, 245)', borderRadius: '4px' }}>
          <Text type='secondary'>该组件暂无预定义属性，可在创建后通过属性面板编辑</Text>
        </div>
      );
    }

    return schema.properties.map((prop: PropertySchema) => {
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
    });
  };

  // 渲染空状态
  if (!selectedAnnotation && !selectedDSLNodeId && !isMultiSelection) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          background: 'rgb(255, 255, 255)',
        }}>
        <div style={{ textAlign: 'center' }}>
          <Text type='secondary'>请在画布或图层树中选择一个节点</Text>
        </div>
      </div>
    );
  }

  // 渲染DSL节点选择状态（创建标注）
  if (isMultiSelection || (selectedDSLNodeId && !selectedAnnotation)) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'rgb(255, 255, 255)' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid rgb(240, 240, 240)' }}>
          <Title level={5} style={{ margin: 0 }}>
            创建标注
          </Title>
          <Text type='secondary' style={{ fontSize: 12 }}>
            {isMultiSelection ? `为选中的 ${totalSelectedCount} 个节点创建组合标注` : '为选中的节点创建FTA组件标注'}
          </Text>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
          {isMultiSelection ? (
            <Card size='small' style={{ marginBottom: 16 }}>
              <Space direction='vertical' size={4} style={{ width: '100%' }}>
                <Text strong>多选状态</Text>
                <Text type='secondary'>已选择 {totalSelectedCount} 个节点</Text>
                {selectedAnnotationCount > 0 && (
                  <Text type='secondary' style={{ fontSize: 12 }}>
                    • 已标注: {selectedAnnotationCount} 个
                  </Text>
                )}
                {selectedDSLNodeCount > 0 && (
                  <Text type='secondary' style={{ fontSize: 12 }}>
                    • 未标注: {selectedDSLNodeCount} 个
                  </Text>
                )}
                <Text type='warning' style={{ fontSize: 12, marginTop: 8 }}>
                  可创建组合标注，或在框线互不重叠时使用下方批量创建按钮
                </Text>
              </Space>
            </Card>
          ) : (
            <Card size='small' style={{ marginBottom: 16 }}>
              <Space direction='vertical' size={0} style={{ width: '100%' }}>
                <Text type='secondary'>DSL节点ID:</Text>
                <Text code>{selectedDSLNodeId}</Text>
              </Space>
            </Card>
          )}

          <Form form={form} layout='vertical' onValuesChange={handleValuesChange}>
            <Form.Item label='FTA 组件类型' name='ftaComponent' rules={[{ required: true, message: '请选择组件类型' }]}>
              <Select
                placeholder='选择组件类型'
                showSearch
                filterOption={customFilterOption}
                onChange={(value) => setSelectedFTAComponent(value)}>
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

            {/* 基本属性 */}
            <Form.Item label='组件名称' name='name'>
              <Input placeholder='输入组件实例名称（可选）' />
            </Form.Item>

            <Form.Item label='组件说明' name='comment'>
              <TextArea rows={2} placeholder='输入组件说明或备注（可选）' />
            </Form.Item>

            {/* 动态属性字段 */}
            {selectedFTAComponent && (
              <>
                <Divider orientation='left' style={{ margin: '16px 0' }}>
                  <Text strong>组件属性</Text>
                </Divider>
                {renderDynamicPropertyFields(selectedFTAComponent)}
              </>
            )}
          </Form>
        </div>

        <div
          style={{
            padding: '16px',
            borderTop: '1px solid rgb(240, 240, 240)',
            background: 'rgb(250, 250, 250)',
          }}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Button type='primary' icon={<PlusOutlined />} block onClick={handleCreateAnnotation}>
              {isMultiSelection ? '创建组合标注' : '创建标注'}
            </Button>

            {isMultiSelection && (
              <>
                <Button icon={<CopyOutlined />} block disabled={!canBatchCreate} onClick={handleBatchCreateAnnotations}>
                  批量创建标注
                </Button>
                {hasSelectionCollision && (
                  <Text type='secondary' style={{ fontSize: 12 }}>
                    选中的框线存在交叉或包含关系，无法批量创建。
                  </Text>
                )}
                {!hasSelectionCollision && batchTargetDSLNodes.length === 0 && (
                  <Text type='secondary' style={{ fontSize: 12 }}>
                    选中的节点已创建标注或不可批量处理。
                  </Text>
                )}
              </>
            )}
          </Space>
        </div>
      </div>
    );
  }

  // 渲染标注编辑状态
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'rgb(255, 255, 255)' }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid rgb(240, 240, 240)' }}>
        <Space direction='vertical' style={{ width: '100%' }} size={0}>
          <Title level={5} style={{ margin: 0 }}>
            组件属性
          </Title>
          <Text type='secondary' style={{ fontSize: 12 }}>
            ID: {selectedAnnotation?.id}
          </Text>
          {selectedAnnotation?.isRoot && (
            <Text type='success' style={{ fontSize: 12 }}>
              页面根节点
            </Text>
          )}
        </Space>
      </div>

      {/* Form */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        <Form form={form} layout='vertical' onValuesChange={handleValuesChange}>
          {/* Basic Info */}
          <Title level={5}>基本信息</Title>

          <Form.Item label='FTA 组件类型' name='ftaComponent' rules={[{ required: true, message: '请选择组件类型' }]}>
            <Select
              placeholder='选择组件类型'
              showSearch
              filterOption={customFilterOption}
              disabled={selectedAnnotation?.isRoot}>
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

          <Form.Item label='组件名称' name='name'>
            <Input placeholder='输入组件实例名称' />
          </Form.Item>

          <Form.Item label='组件说明' name='comment'>
            <TextArea rows={2} placeholder='输入组件说明或备注' />
          </Form.Item>

          <Divider />

          {/* Layout Properties */}
          <Title level={5}>布局属性</Title>

          <Space style={{ width: '100%' }} size='small'>
            <Form.Item label='宽度' name='width' style={{ flex: 1, marginBottom: 8 }}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder='auto' />
            </Form.Item>
            <Form.Item label='高度' name='height' style={{ flex: 1, marginBottom: 8 }}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder='auto' />
            </Form.Item>
          </Space>

          <Form.Item label='定位方式' name='position'>
            <Select
              placeholder='选择定位方式'
              options={[
                { label: 'Relative', value: 'relative' },
                { label: 'Absolute', value: 'absolute' },
                { label: 'Fixed', value: 'fixed' },
              ]}
              allowClear
            />
          </Form.Item>

          <Form.Item label='Flex 方向' name='flexDirection'>
            <Select
              placeholder='选择 flex 方向'
              options={[
                { label: 'Row', value: 'row' },
                { label: 'Column', value: 'column' },
              ]}
              allowClear
            />
          </Form.Item>

          <Form.Item label='对齐方式 (alignItems)' name='alignItems'>
            <Select
              placeholder='选择对齐方式'
              options={[
                { label: 'Flex Start', value: 'flex-start' },
                { label: 'Center', value: 'center' },
                { label: 'Flex End', value: 'flex-end' },
                { label: 'Stretch', value: 'stretch' },
              ]}
              allowClear
            />
          </Form.Item>

          <Form.Item label='主轴对齐 (justifyContent)' name='justifyContent'>
            <Select
              placeholder='选择主轴对齐'
              options={[
                { label: 'Flex Start', value: 'flex-start' },
                { label: 'Center', value: 'center' },
                { label: 'Flex End', value: 'flex-end' },
                { label: 'Space Between', value: 'space-between' },
                { label: 'Space Around', value: 'space-around' },
              ]}
              allowClear
            />
          </Form.Item>

          <Form.Item label='Flex' name='flex'>
            <InputNumber min={0} style={{ width: '100%' }} placeholder='0' />
          </Form.Item>

          <Form.Item label='间距 (gap)' name='gap'>
            <InputNumber min={0} style={{ width: '100%' }} placeholder='0' />
          </Form.Item>

          <Form.Item label='内边距 (padding)' name='padding'>
            <Input placeholder='例如: 10px 或 10px 20px' />
          </Form.Item>

          <Form.Item label='外边距 (margin)' name='margin'>
            <Input placeholder='例如: 10px 或 10px 20px' />
          </Form.Item>

          <Form.Item label='背景颜色' name='backgroundColor'>
            <Input placeholder='例如: rgb(255, 255, 255) 或 rgb(255, 255, 255)' />
          </Form.Item>

          <Form.Item label='圆角 (borderRadius)' name='borderRadius'>
            <Input placeholder='例如: 4px 或 50%' />
          </Form.Item>

          <Divider />

          {/* Component Props */}
          <Title level={5}>组件属性</Title>

          <Form.Item label='Props (JSON)' name='props' help='以 JSON 格式输入组件的自定义属性'>
            <TextArea rows={6} placeholder='例如: {"content": "按钮文字", "type": "primary"}' />
          </Form.Item>
        </Form>
      </div>

      {/* Actions */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid rgb(240, 240, 240)',
          background: 'rgb(250, 250, 250)',
        }}>
        <Space style={{ width: '100%', justifyContent: 'center' }}>
          <Button type='primary' icon={<SaveOutlined />} onClick={handleSave} disabled={!hasChanges}>
            保存
          </Button>
          {!selectedAnnotation?.isRoot && (
            <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
              删除
            </Button>
          )}
        </Space>
      </div>
    </div>
  );
};

export default ComponentPropertyPanelV2;
