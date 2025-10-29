import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Tree, Button, Space, Typography, App, Checkbox, Drawer, Tooltip } from 'antd';
import type { DataNode, TreeProps } from 'antd/es/tree';
import {
  FolderOutlined,
  FileOutlined,
  DownOutlined,
  UpOutlined,
  SaveOutlined,
  FileTextOutlined,
  ApartmentOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import { useComponentDetectionV2 } from '../contexts/ComponentDetectionContextV2';
import { AnnotationNode } from '../types/componentDetectionV2';
import type { DSLData, DSLNode } from '@/types/dsl';

const { Title, Text } = Typography;

interface LayerTreePanelProps {
  onSave?: () => void;
  onGenerateDoc?: () => void;
  dslData?: DSLData | null;
  onToggleNodeVisibility?: (nodeId: string, hidden: boolean) => void;
  onResetNodeVisibility?: () => void;
  dslSelectedNodeId?: string | null;
  onSelectDslNode?: (nodeId: string | null) => void;
  onHoverDslNode?: (nodeId: string | null) => void;
}

const LayerTreePanel: React.FC<LayerTreePanelProps> = ({
  onSave,
  onGenerateDoc,
  dslData,
  onToggleNodeVisibility,
  onResetNodeVisibility,
  dslSelectedNodeId,
  onSelectDslNode,
  onHoverDslNode,
}) => {
  const { modal, message } = App.useApp();
  const {
    rootAnnotation,
    selectedAnnotationId,
    expandedKeys,
    selectAnnotation,
    deleteAnnotation,
    setExpandedKeys,
    expandAll,
    collapseAll,
    findAnnotationById,
    validateMove,
    moveAnnotation,
  } = useComponentDetectionV2();

  // 键盘状态监听
  const [isCmdPressed, setIsCmdPressed] = useState(false);
  const [isDslDrawerOpen, setIsDslDrawerOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Meta' || e.key === 'Control') {
        setIsCmdPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Meta' || e.key === 'Control') {
        setIsCmdPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 转换AnnotationNode为Tree DataNode
  const convertToTreeData = (node: AnnotationNode): DataNode => {
    const isRoot = node.isRoot;
    const isContainer = node.isContainer;

    const title = (
      <Space size={4}>
        {isContainer ? (
          <FolderOutlined style={{ color: isRoot ? 'rgb(82, 196, 26)' : 'rgb(24, 144, 255)' }} />
        ) : (
          <FileOutlined style={{ color: 'rgb(140, 140, 140)' }} />
        )}
        <span style={{ fontWeight: isRoot ? 600 : 400 }}>
          {node.ftaComponent}
          {node.name && ` (${node.name})`}
        </span>
        {isRoot && <span style={{ fontSize: 12, color: 'rgb(82, 196, 26)' }}>[页面根节点]</span>}
      </Space>
    );

    return {
      key: node.id,
      title,
      children: node.children.map(convertToTreeData),
      isLeaf: node.children.length === 0,
    };
  };

  // 生成Tree数据
  const treeData: DataNode[] = useMemo(() => {
    if (!rootAnnotation) return [];
    return [convertToTreeData(rootAnnotation)];
  }, [rootAnnotation]);

  const handleDslNodeVisibilityToggle = useCallback(
    (node: DSLNode, nextHidden: boolean) => {
      onToggleNodeVisibility?.(node.id, nextHidden);
    },
    [onToggleNodeVisibility]
  );

  const buildDslTreeData = useCallback(
    (nodes?: DSLNode[]): DataNode[] =>
      (nodes || []).map((dslNode) => {
        const hidden = Boolean(dslNode.hidden);
        const title = (
          <Space size={6}>
            <span
              style={{
                opacity: hidden ? 0.45 : 1,
                textDecoration: hidden ? 'line-through' : undefined,
              }}
            >
              {dslNode.name || dslNode.type}
            </span>
            <Tooltip title={hidden ? '显示节点' : '隐藏节点'}>
              <Button
                size="small"
                type="text"
                icon={hidden ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={(event) => {
                  event.stopPropagation();
                  handleDslNodeVisibilityToggle(dslNode, !hidden);
                }}
              />
            </Tooltip>
          </Space>
        );

        return {
          key: dslNode.id,
          title,
          children: buildDslTreeData(dslNode.children),
        };
      }),
    [handleDslNodeVisibilityToggle]
  );

  const dslTreeData = useMemo(() => {
    const nodes = dslData?.dsl?.nodes || [];
    return buildDslTreeData(nodes);
  }, [buildDslTreeData, dslData]);

  const hasHiddenNodes = useMemo(() => {
    const checkHidden = (nodes?: DSLNode[]): boolean => {
      if (!nodes) return false;
      return nodes.some((node) => node.hidden || checkHidden(node.children));
    };
    return checkHidden(dslData?.dsl?.nodes);
  }, [dslData]);

  const handleDslTreeSelect: TreeProps['onSelect'] = (selectedKeysValue) => {
    if (!selectedKeysValue.length) {
      onSelectDslNode?.(null);
      return;
    }
    const targetKey = selectedKeysValue[selectedKeysValue.length - 1] as string;
    const isSameSelection = dslSelectedNodeId === targetKey;
    if (isSameSelection) {
      onSelectDslNode?.(null);
      return;
    }
    onSelectDslNode?.(targetKey);
  };

  const handleDslTreeMouseEnter: TreeProps['onMouseEnter'] = ({ node }) => {
    onHoverDslNode?.(node.key as string);
  };

  const handleDslTreeMouseLeave: TreeProps['onMouseLeave'] = () => {
    onHoverDslNode?.(null);
  };

  const handleShowAllNodes = useCallback(() => {
    if (!onResetNodeVisibility) {
      message.warning('当前 DSL 数据不可编辑');
      return;
    }
    onResetNodeVisibility();
    message.success('已显示所有节点');
  }, [message, onResetNodeVisibility]);

  const handleCloseDslDrawer = useCallback(() => {
    setIsDslDrawerOpen(false);
    onSelectDslNode?.(null);
    onHoverDslNode?.(null);
  }, [onHoverDslNode, onSelectDslNode]);

  // 处理节点选择
  const handleSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      // 如果按住 Cmd/Ctrl 键，使用多选模式；否则使用单选模式
      selectAnnotation(selectedKeys[0] as string, isCmdPressed);
    } else {
      selectAnnotation(null);
    }
  };

  // 处理右键菜单
  const handleRightClick = ({ event, node }: any) => {
    event.preventDefault();

    const nodeKey = node.key as string;
    const annotation: AnnotationNode | null = findAnnotationById(nodeKey);

    // 页面根节点不能删除
    if (nodeKey === 'root') {
      modal.warning({
        title: '无法删除',
        content: '页面根节点不能删除',
      });
      return;
    }

    let deleteChildren = false;
    const displayName = annotation
      ? `${annotation.ftaComponent}${annotation.name ? ` (${annotation.name})` : ''}`
      : nodeKey;

    modal.confirm({
      title: '删除标注',
      content: (
        <Space direction="vertical" size={4}>
          <span>确定要删除标注 "{displayName}" 吗？</span>
          <Checkbox
            onChange={(e) => {
              deleteChildren = e.target.checked;
            }}
          >
            同时删除所有子标注
          </Checkbox>
          <Text type="secondary" style={{ fontSize: 12 }}>
            不勾选时仅删除当前标注，子标注将自动提升一级
          </Text>
        </Space>
      ),
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        deleteAnnotation(nodeKey, { deleteChildren });
      },
    });
  };

  // 处理展开/收起
  const handleExpand = (expandedKeysValue: React.Key[]) => {
    setExpandedKeys(expandedKeysValue as string[]);
  };

  // 处理拖拽验证
  const handleAllowDrop: TreeProps['allowDrop'] = ({ dropNode, dropPosition }) => {
    // dropPosition:
    // -1: 插入到目标节点之前 (before)
    //  0: 插入到目标节点内部 (inside)
    //  1: 插入到目标节点之后 (after)

    // 根节点不允许作为目标（不能在根节点前后插入）
    if (dropNode.key === 'root' && dropPosition !== 0) {
      return false;
    }

    // 允许拖入根节点内部
    return true;
  };

  // 处理拖拽放置
  const handleDrop: TreeProps['onDrop'] = async (info) => {
    const sourceKey = info.dragNode.key as string;
    const targetKey = info.node.key as string;
    const dropPosition = info.dropPosition;
    const dropToGap = info.dropToGap; // 是否放置在节点间隙

    // 确定放置位置
    let position: 'before' | 'inside' | 'after';

    if (!dropToGap) {
      // 放置在节点内部
      position = 'inside';
    } else {
      // 放置在节点前后
      const targetParent = rootAnnotation ? findParent(rootAnnotation, targetKey) : null;

      if (targetParent) {
        const targetIndex = targetParent.children.findIndex((child) => child.id === targetKey);
        // dropPosition 是相对于整个树的位置，需要判断是 before 还是 after
        position = dropPosition < 0 || (dropPosition === 0 && targetIndex === 0) ? 'before' : 'after';
      } else {
        // 根节点
        position = dropPosition > 0 ? 'after' : 'before';
      }
    }

    // 先验证
    const validation = validateMove(sourceKey, targetKey, position);
    if (!validation.valid) {
      message.warning(validation.reason || '不允许此操作');
      return;
    }

    // 执行移动
    const result = await moveAnnotation(sourceKey, targetKey, position);
    if (!result.success) {
      message.error(result.error || '移动失败');
    } else {
      message.success('移动成功');
    }
  };

  // 辅助函数：查找父节点
  const findParent = (root: AnnotationNode, childId: string): AnnotationNode | null => {
    for (const child of root.children) {
      if (child.id === childId) {
        return root;
      }
      const found = findParent(child, childId);
      if (found) return found;
    }
    return null;
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'rgb(255, 255, 255)' }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid rgb(240, 240, 240)' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <Title level={5} style={{ margin: 0 }}>
            图层结构
          </Title>
          <Space size="small">
            <Button size="small" icon={<DownOutlined />} onClick={expandAll}>
              展开全部
            </Button>
            <Button size="small" icon={<UpOutlined />} onClick={collapseAll}>
              收起全部
            </Button>
            <Button
              size="small"
              icon={<ApartmentOutlined />}
              onClick={() => setIsDslDrawerOpen(true)}
              disabled={!dslData}
            >
              组件树
            </Button>
          </Space>
        </Space>
      </div>

      {/* Tree */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        <Tree
          treeData={treeData}
          selectedKeys={selectedAnnotationId ? [selectedAnnotationId] : []}
          expandedKeys={expandedKeys}
          onSelect={handleSelect}
          onExpand={handleExpand}
          onRightClick={handleRightClick}
          draggable={{
            icon: false,
            nodeDraggable: (node) => node.key !== 'root',
          }}
          onDrop={handleDrop}
          allowDrop={handleAllowDrop}
          showLine={{ showLeafIcon: false }}
          showIcon
          blockNode
        />
      </div>

      {/* Footer */}
      {(onSave || onGenerateDoc) && (
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid rgb(240, 240, 240)',
            background: 'rgb(255, 255, 255)',
            borderBottom: '1px solid rgb(240, 240, 240)',
          }}
        >
          <Space size="small" style={{ width: '100%', justifyContent: 'center' }}>
            {onSave && (
              <Button type="primary" size="small" icon={<SaveOutlined />} onClick={onSave} style={{ minWidth: '80px' }}>
                保存
              </Button>
            )}
            {onGenerateDoc && (
              <Button size="small" icon={<FileTextOutlined />} onClick={onGenerateDoc} style={{ minWidth: '120px' }}>
                生成需求规格文档
              </Button>
            )}
          </Space>
        </div>
      )}
      <Drawer
        placement="left"
        title="组件树"
        width={320}
        open={isDslDrawerOpen}
        onClose={handleCloseDslDrawer}
        mask={false}
        extra={
          <Button size="small" onClick={handleShowAllNodes} disabled={!hasHiddenNodes} icon={<EyeOutlined />}>
            全部显示
          </Button>
        }
      >
        <div style={{ paddingRight: 8 }}>
          <Tree
            treeData={dslTreeData}
            defaultExpandAll
            selectedKeys={dslSelectedNodeId ? [dslSelectedNodeId] : []}
            onSelect={handleDslTreeSelect}
            onMouseEnter={handleDslTreeMouseEnter}
            onMouseLeave={handleDslTreeMouseLeave}
          />
        </div>
      </Drawer>
    </div>
  );
};

export default LayerTreePanel;
