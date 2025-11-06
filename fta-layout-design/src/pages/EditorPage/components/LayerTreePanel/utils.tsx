import { DSLData } from '@/types/dsl';
import { CompressOutlined, ExpandOutlined, FileOutlined, FolderOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Space, Tooltip } from 'antd';
import { DataNode } from 'antd/es/tree';
import { componentDetectionActions } from '../../contexts/ComponentDetectionContext';
import { AnnotationNode } from '../../types/componentDetectionV2';

export const createRootAnnotationFromDSL = (dslData: DSLData, docId: string): AnnotationNode | null => {
  const rootNode = dslData?.dsl?.nodes?.[0];
  if (!rootNode) {
    return null;
  }

  const now = Date.now();
  return {
    id: `design-root-${docId}`,
    dslNodeId: rootNode.id,
    dslNode: rootNode,
    ftaComponent: 'View',
    name: 'Component',
    isRoot: true,
    isContainer: true,
    children: [],
    absoluteX: 0,
    absoluteY: 0,
    width: rootNode.layoutStyle?.width || 720,
    height: rootNode.layoutStyle?.height || 1560,
    createdAt: now,
    updatedAt: now,
  };
};

// 转换AnnotationNode为Tree DataNode
export const convertToTreeData = (
  node: AnnotationNode,
  options: { isFirstLevel?: boolean; isActiveDoc?: boolean; documentName?: string } = {}
): DataNode => {
  const { isFirstLevel = false, isActiveDoc = false, documentName } = options;
  const isRoot = node.isRoot;
  const isContainer = node.isContainer;

  const title = (
    <Space size={4} style={{ width: '100%', justifyContent: 'space-between' }}>
      <Space size={4}>
        {isContainer ? (
          <FolderOutlined style={{ color: isRoot ? 'rgb(82, 196, 26)' : 'rgb(24, 144, 255)' }} />
        ) : (
          <FileOutlined style={{ color: 'rgb(140, 140, 140)' }} />
        )}
        <span style={{ fontWeight: isRoot ? 600 : 400 }}>
          {node.name ? `${node.name} (${node.ftaComponent})` : node.ftaComponent}
          {/* {isRoot && documentName && (
              <span style={{ marginLeft: 8, fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>{documentName}</span>
            )} */}
        </span>
        {isRoot && (
          <span style={{ fontSize: 12, color: 'rgb(82, 196, 26)' }}>{isActiveDoc ? '[主页面]' : '[组件]'}</span>
        )}
      </Space>
      {isFirstLevel && isActiveDoc && (
        <Space size={4}>
          <Tooltip title='展开全部' color='#eee'>
            <Button
              type='text'
              size='small'
              icon={<ExpandOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                componentDetectionActions.expandAll();
              }}
            />
          </Tooltip>
          <Tooltip title='收起全部' color='#eee'>
            <Button
              type='text'
              size='small'
              icon={<CompressOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                componentDetectionActions.collapseAll();
              }}
            />
          </Tooltip>
          <Tooltip title='设置' color='#eee'>
            <Button
              type='text'
              size='small'
              icon={<SettingOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                // TODO: 添加设置功能
              }}
            />
          </Tooltip>
        </Space>
      )}
    </Space>
  );

  return {
    key: node.id,
    title,
    children: node.children.map((child) => convertToTreeData(child, { isActiveDoc })),
    isLeaf: node.children.length === 0,
    selectable: true,
  };
};

export const nodeContainsKey = (node: DataNode, targetKey: React.Key): boolean => {
  if (node.key === targetKey) {
    return true;
  }

  if (!node.children || node.children.length === 0) {
    return false;
  }

  return node.children.some((child) => nodeContainsKey(child, targetKey));
};

export const findTopLevelKey = (treeData: DataNode[], targetKey: React.Key): string | null => {
  for (const node of treeData) {
    if (nodeContainsKey(node, targetKey)) {
      if (typeof node.key === 'string') {
        return node.key;
      }
      if (typeof node.key === 'number') {
        return node.key.toString();
      }
      return null;
    }
  }
  return null;
};

export const extractDesignIdFromTopLevelKey = (key: string | null): string | null => {
  if (!key) {
    return null;
  }
  const designRootPrefix = 'design-root-';
  const designDocPrefix = 'design-doc-';

  if (key.startsWith(designRootPrefix)) {
    return key.substring(designRootPrefix.length);
  }

  if (key.startsWith(designDocPrefix)) {
    return key.substring(designDocPrefix.length);
  }

  return null;
};
