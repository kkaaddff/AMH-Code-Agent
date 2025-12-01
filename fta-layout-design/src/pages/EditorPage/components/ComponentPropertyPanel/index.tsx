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
import { App, Button, Card, Checkbox, Divider, Form, Space, Tooltip, Typography } from 'antd';
import type { DefaultOptionType } from 'antd/es/cascader';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSnapshot } from 'valtio';
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
import { getComponentSchema } from '../../constants/FTAComponentSchemas';
import { BasicInfoFields, DataModelBindingField, DynamicPropertyFields, FTAComponentSelectField } from './FormFields';

import './index.css';

const { Title, Text } = Typography;

const ComponentPropertyPanelV2: React.FC = () => {
  const { message, modal } = App.useApp();
  const { selectedAnnotation, selectedDSLNode, selectedNodeIds, designData } = useSnapshot(designDetectionStore);
  const { selectedDocument, projectId, dataModels: dataModelsList, dataModelGroups } = useSnapshot(editorPageStore);
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
        designDetectionActions.saveAnnotations(selectedDocument?.id!);
        message.success('已删除标注');
      },
    });
  };

  const isMultiSelection = useMemo(() => selectedNodeIds.length > 1, [selectedNodeIds]);

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

        const separated = ax2 <= b.x || bx2 <= a.x || ay2 <= b.y || by2 <= a.y;

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
        if (ftaComponent) {
          const updatedRecent = addRecentComponent(ftaComponent);
          setRecentComponents(updatedRecent);
        }
        form.resetFields();
        setSelectedFTAComponent('');
        designDetectionActions.saveAnnotations(selectedDocument?.id!);
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
        if (ftaComponent) {
          const updatedRecent = addRecentComponent(ftaComponent);
          setRecentComponents(updatedRecent);
        }
        form.resetFields();
        setSelectedFTAComponent('');
        designDetectionActions.saveAnnotations(selectedDocument?.id!);
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
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();

        if (selectedAnnotation) return;

        if (!isMultiSelection && !selectedDSLNode) {
          message.warning('请先选择一个节点');
          return;
        }

        handleCreateAnnotation();
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace') {
        e.preventDefault();

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

  const handleToggleVisibilityAndSave = async () => {
    designDetectionActions.toggleDSLNodeById(selectedDSLNode!.id);
    try {
      await apiServices.project.updateDocument({
        id: selectedDocument!.id!,
        data: designData as DesignData,
      });
      message.success('设计稿已保存');
    } catch (error: any) {
      message.error(error?.message ?? '保存设计稿失败');
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
            <FTAComponentSelectField
              recentComponents={recentComponents}
              onChange={handleComponentSelect}
              labelExtra={
                <Button
                  size='small'
                  type='primary'
                  icon={<TagOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedFTAComponent) {
                      handleCreateAnnotation();
                    } else {
                      message.info('请先选择组件类型');
                    }
                  }}>
                  快速创建标注
                </Button>
              }
            />

            <BasicInfoFields optionalSuffix />

            {selectedFTAComponent && <DynamicPropertyFields componentName={selectedFTAComponent} />}

            <DataModelBindingField cascaderOptions={cascaderOptions} dataModelsList={dataModelsList as DataModel[]} />
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
          <Title level={5}>基本信息</Title>

          <FTAComponentSelectField
            recentComponents={recentComponents}
            onChange={handleComponentSelect}
            disabled={selectedAnnotation?.isRoot}
          />

          <BasicInfoFields />

          <Divider />
          <Title level={5}>组件属性</Title>
          {selectedAnnotation?.ftaComponent && (
            <DynamicPropertyFields componentName={selectedAnnotation.ftaComponent} showDivider={false} />
          )}

          <Divider />
          <Title level={5}>
            <DatabaseOutlined style={{ marginRight: 8 }} />
            数据绑定
          </Title>
          <DataModelBindingField
            cascaderOptions={cascaderOptions}
            dataModelsList={dataModelsList as DataModel[]}
            showDivider={false}
          />

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
