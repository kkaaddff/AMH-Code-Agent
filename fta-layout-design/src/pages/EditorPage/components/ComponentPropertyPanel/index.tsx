import { apiServices } from '@/services';
import type { DataModel, DataModelGroup } from '@/types/dataModel';
import { DesignData, DSLNode } from '@/types/dsl';
import {
  CopyOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  SaveOutlined,
  TagOutlined,
} from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Cascader,
  Checkbox,
  Divider,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Tooltip,
  Typography,
} from 'antd';
import type { DefaultOptionType } from 'antd/es/cascader';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSnapshot } from 'valtio';
import { FTA_COMPONENTS } from '../../constants/FTAComponents';
import { getComponentSchema, PropertySchema } from '../../constants/FTAComponentSchemas';
import { addRecentComponent, getRecentComponents } from '../../utils/recentComponentStorage';
import {
  calculateDSLNodeAbsolutePosition,
  designDetectionActions,
  designDetectionStore,
  findAnnotationByDSLNodeId,
  findAnnotationById,
  findDSLNodeById,
} from '../../contexts/DesignDetectionContext';
import { editorPageActions, editorPageStore } from '../../contexts/EditorPageContext';
import { NodeType } from '../../types/componentDetection';

import './index.css';

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
  const { selectedAnnotation, selectedDSLNode, selectedNodeIds, designData } = useSnapshot(designDetectionStore);
  const {
    selectedDocument,
    currentPage,
    projectId,
    dataModels: dataModelsList,
    dataModelGroups,
  } = useSnapshot(editorPageStore);
  const [form] = Form.useForm();
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedFTAComponent, setSelectedFTAComponent] = useState<string>('');
  const [recentComponents, setRecentComponents] = useState<string[]>(() => getRecentComponents());

  // 处理组件类型选择变化，更新最近选择列表
  const handleComponentSelect = useCallback((value: string) => {
    setSelectedFTAComponent(value);
    if (value) {
      const updated = addRecentComponent(value);
      setRecentComponents(updated);
    }
  }, []);

  const selectedDesignDocument = useMemo(() => {
    if (!currentPage || selectedDocument?.type !== 'design') {
      return null;
    }
    return currentPage.designDocuments.find((doc) => doc.id === selectedDocument.id) ?? null;
  }, [currentPage, selectedDocument]);

  // 页面变化时加载数据模型
  useEffect(() => {
    if (projectId) {
      editorPageActions.loadDataModels();
    }
  }, [projectId]);

  // 构建 Cascader 选项（分组 -> 数据模型）
  const cascaderOptions = useMemo<DefaultOptionType[]>(() => {
    const groups = dataModelGroups as DataModelGroup[];
    const models = dataModelsList as DataModel[];

    const options: DefaultOptionType[] = [];

    const ungroupedModels = models.filter((m) => !m.groupId);
    if (ungroupedModels.length > 0) {
      options.push({
        value: '__ungrouped__',
        label: '未分组',
        children: ungroupedModels.map((m) => ({
          value: m.id,
          label: m.name,
          description: m.description,
        })),
      });
    }

    groups.forEach((group) => {
      const groupModels = models.filter((m) => m.groupId === group.id);
      if (groupModels.length > 0) {
        options.push({
          value: group.id,
          label: group.name,
          description: group.description,
          children: groupModels.map((m) => ({
            value: m.id,
            label: m.name,
            description: m.description,
          })),
        });
      }
    });

    return options;
  }, [dataModelsList, dataModelGroups]);

  // 初始化表单值
  useEffect(() => {
    if (selectedAnnotation) {
      form.setFieldsValue({
        ftaComponent: selectedAnnotation.ftaComponent,
        name: selectedAnnotation.name || '',
        comment: selectedAnnotation.comment || '',
        props: JSON.stringify(selectedAnnotation.props || {}, null, 2),
        dataModelId: selectedAnnotation.props?.dataModelId || undefined,
      });
      setHasChanges(false);
    } else {
      form.resetFields();
      setHasChanges(false);
    }
  }, [selectedAnnotation, form]);

  const handleValuesChange = () => {
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!selectedAnnotation) return;

    try {
      const values = await form.validateFields();

      // Parse props JSON
      let props: Record<string, any> = {};
      try {
        if (values.props) {
          props = JSON.parse(values.props);
        }
      } catch (error) {
        message.error('组件属性 JSON 格式错误');
        return;
      }

      // 添加数据模型绑定到 props
      if (values.dataModelId) {
        props.dataModelId = values.dataModelId;
      } else {
        delete props.dataModelId;
      }

      // Update annotation
      const updated = await designDetectionActions.updateAnnotation(selectedAnnotation.id, {
        ftaComponent: values.ftaComponent,
        name: values.name,
        comment: values.comment,
        props,
      });

      if (updated) {
        setHasChanges(false);
        message.success('保存成功');
        // 更新最近选择列表
        if (values.ftaComponent) {
          const updatedRecent = addRecentComponent(values.ftaComponent);
          setRecentComponents(updatedRecent);
        }
      } else {
        message.info('已取消更新');
      }
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

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
        designDetectionActions.deleteAnnotation(selectedAnnotation.id, {
          docId: selectedDocument?.id!,
          deleteChildren,
        });
        message.success('已删除标注');
      },
    });
  };

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
        const annotation = findAnnotationById(item.id, designDetectionStore.rootAnnotation);
        if (!annotation) return;
        bounds.push({
          id: item.id,
          x: annotation.absoluteX,
          y: annotation.absoluteY,
          width: annotation.width,
          height: annotation.height,
        });
      } else if (item.type === NodeType.DSL) {
        const node = findDSLNodeById(item.id, designDetectionStore.dslRootNode);
        if (!node) return;
        const { x, y } = calculateDSLNodeAbsolutePosition(node, designDetectionStore.flatDSLNodeList);
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
      const node = findDSLNodeById(item.id, designDetectionStore.dslRootNode);
      if (!node) return;
      const alreadyAnnotated = !!findAnnotationByDSLNodeId(node.id, designDetectionStore.rootAnnotation);
      if (alreadyAnnotated) return;
      nodes.push(node);
    });

    return nodes;
  }, [isMultiSelection, selectedNodeIds]);

  const canBatchCreate = isMultiSelection && !hasSelectionCollision && batchTargetDSLNodes.length > 0;

  const handleCreateAnnotation = async () => {
    try {
      const values = await form.validateFields();
      const ftaComponent = values.ftaComponent;
      let shouldResetForm = false;
      if (isMultiSelection) {
        const combined = designDetectionActions.combineSelectedDSLNodes(ftaComponent);
        if (combined) {
          message.success('已创建组合标注');
          shouldResetForm = true;
        } else {
          message.info('未创建组合标注');
        }
      } else if (selectedDSLNode) {
        const { ftaComponent: _, name, comment, ...componentProps } = values;
        const created = await designDetectionActions.createAnnotation(selectedDSLNode as DSLNode, ftaComponent, {
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
        // 确保更新最近选择列表（创建成功时）
        if (ftaComponent) {
          const updatedRecent = addRecentComponent(ftaComponent);
          setRecentComponents(updatedRecent);
        }
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
        const created = await designDetectionActions.createAnnotation(dslNode, ftaComponent, {
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
        // 确保更新最近选择列表（批量创建成功时）
        if (ftaComponent) {
          const updatedRecent = addRecentComponent(ftaComponent);
          setRecentComponents(updatedRecent);
        }
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

        if (!isMultiSelection && !selectedDSLNode) {
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
  }, [selectedAnnotation, selectedAnnotation, selectedDSLNode, isMultiSelection, message]);

  // 渲染动态属性字段
  const renderDynamicPropertyFields = (componentName: string) => {
    if (!componentName) return null;

    const schema = getComponentSchema(componentName);

    if (!schema || schema.properties.length === 0) {
      return (
        <div className='component-property-panel-dynamic-properties-hint'>
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

  const handleToggleVisibilityAndSave = async () => {
    designDetectionActions.toggleDSLNodeById(selectedDSLNode!.id);
    try {
      await apiServices.project.updateDocument({
        id: selectedDocument!.id!,
        data: designData as DesignData,
      });
      message.success('DSL 已保存');
    } catch (error: any) {
      message.error(error?.message ?? '保存 DSL 失败');
    } finally {
      designDetectionActions.clearSelection();
    }
  };

  // 渲染空状态
  if (!selectedAnnotation && !selectedDSLNode && !isMultiSelection) {
    return (
      <div className='component-property-panel-empty-state'>
        <div className='component-property-panel-empty-state-text'>
          <Text type='secondary'>请在画布或图层树中选择一个节点</Text>
        </div>
      </div>
    );
  }

  // 渲染DSL节点选择状态（创建标注）
  if (isMultiSelection || (selectedDSLNode && !selectedAnnotation)) {
    return (
      <div className='component-property-panel-create-mode-container'>
        <div className='component-property-panel-create-mode-header'>
          <Title level={5} style={{ margin: 0 }}>
            创建标注
          </Title>
          <Text type='secondary' style={{ fontSize: 12 }}>
            {isMultiSelection ? `为选中的 ${totalSelectedCount} 个节点创建组合标注` : '为选中的节点创建FTA组件标注'}
          </Text>
        </div>

        <div className='component-property-panel-create-mode-form'>
          {isMultiSelection ? (
            <Card size='small' className='component-property-panel-selection-card'>
              <Space direction='vertical' size={4} className='component-property-panel-selection-space'>
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
                <Text type='warning' style={{ fontSize: 12 }} className='component-property-panel-warning-text'>
                  可创建组合标注，或在框线互不重叠时使用下方批量创建按钮
                </Text>
              </Space>
            </Card>
          ) : (
            <Card size='small' className='component-property-panel-info-card'>
              <div className='component-property-panel-info-card-wrapper'>
                <div className='component-property-panel-info-card-grid'>
                  <Text type='secondary'>ID:</Text>
                  <Text>{selectedDSLNode?.id}</Text>
                  <Text type='secondary'>名称:</Text>
                  <Text>{selectedDSLNode?.name}</Text>
                  <Text type='secondary'>类型:</Text>
                  <Text>{selectedDSLNode?.type}</Text>
                </div>
                <Tooltip title='显示/隐藏节点'>
                  <Button
                    size='small'
                    type='primary'
                    icon={<EyeOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleVisibilityAndSave();
                    }}
                  />
                </Tooltip>
              </div>
            </Card>
          )}

          <Form form={form} layout='vertical' onValuesChange={handleValuesChange}>
            <Form.Item
              label={
                <Space>
                  <Text>FTA 组件类型</Text>
                  <Button
                    size='small'
                    type='primary'
                    icon={<TagOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      // 使用默认组件类型快速创建标注
                      if (selectedFTAComponent) {
                        handleCreateAnnotation();
                      } else {
                        message.info('请先选择组件类型');
                      }
                    }}>
                    快速创建标注
                  </Button>
                </Space>
              }
              name='ftaComponent'
              rules={[{ required: true, message: '请选择组件类型' }]}>
              <Select
                placeholder='选择组件类型'
                showSearch
                filterOption={customFilterOption}
                onChange={handleComponentSelect}>
                {/* 最近选择分组 */}
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

        <div className='component-property-panel-create-mode-actions'>
          <Space direction='vertical' className='component-property-panel-create-mode-actions-space'>
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
    <div className='component-property-panel-container'>
      {/* Header */}
      <div className='component-property-panel-header'>
        <Space direction='vertical' className='component-property-panel-header-space' size={0}>
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
      <div className='component-property-panel-form-container'>
        <Form form={form} layout='vertical' onValuesChange={handleValuesChange}>
          {/* Basic Info */}
          <Title level={5}>基本信息</Title>

          <Form.Item label='FTA 组件类型' name='ftaComponent' rules={[{ required: true, message: '请选择组件类型' }]}>
            <Select
              placeholder='选择组件类型'
              showSearch
              filterOption={customFilterOption}
              disabled={selectedAnnotation?.isRoot}
              onChange={handleComponentSelect}>
              {/* 最近选择分组 */}
              {recentComponents.length > 0 && (
                <OptGroup key='最近选择' label='最近选择'>
                  {recentComponents.map((comp) => (
                    <Option key={`recent-edit-${comp}`} value={comp}>
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

          <Form.Item label='组件名称' name='name'>
            <Input placeholder='输入组件实例名称' />
          </Form.Item>

          <Form.Item label='组件说明' name='comment'>
            <TextArea rows={2} placeholder='输入组件说明或备注' />
          </Form.Item>

          <Divider />
          {/* Component Props */}
          <Title level={5}>组件属性</Title>
          {/* 动态属性字段 */}
          {selectedAnnotation?.ftaComponent && renderDynamicPropertyFields(selectedAnnotation.ftaComponent)}

          <Divider />
          {/* Data Model Binding */}
          <Title level={5}>
            <DatabaseOutlined style={{ marginRight: 8 }} />
            数据绑定
          </Title>
          <Form.Item
            label='关联数据模型'
            name='dataModelId'
            extra='选择要绑定的数据模型，用于代码生成时关联数据结构'
            getValueFromEvent={(value: string[]) => {
              // Cascader 返回的是数组 [groupId, modelId]，我们只需要 modelId
              return value && value.length > 1 ? value[1] : undefined;
            }}
            getValueProps={(value) => {
              // 反向查找：根据 modelId 找到对应的 [groupId, modelId] 路径
              if (!value) return { value: undefined };
              const model = (dataModelsList as DataModel[]).find((m) => m.id === value);
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

          <Divider />
        </Form>
      </div>

      {/* Actions */}
      <div className='component-property-panel-actions'>
        <Space className='component-property-panel-actions-space'>
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
