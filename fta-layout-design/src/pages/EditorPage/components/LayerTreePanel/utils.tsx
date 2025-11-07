import { CompressOutlined, ExpandOutlined, FileOutlined, FolderOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Space, Tooltip } from 'antd';
import { DataNode } from 'antd/es/tree';
import { AnnotationNode } from '../../types/componentDetection';
import { designDetectionActions } from '../../contexts/DesignDetectionContext';
import { DocumentReference } from '@/types/project';

export const createRootAnnotationFromDesignDoc = (doc: DocumentReference): AnnotationNode | null => {
  const now = Date.now();
  const rootNode = doc.data?.dsl?.nodes?.[0] ?? null;

  if (!rootNode) {
    return null;
  }
  const rootAnnotationId = `design-root-${doc.id}`;
  const rootAnnotation: AnnotationNode = doc.annotationData?.rootAnnotation ?? {
    id: rootAnnotationId,
    dslNodeId: rootNode.id,
    dslNode: rootNode,
    ftaComponent: 'View',
    name: 'Component',
    isRoot: true,
    isMainPage: false,
    isContainer: true,
    children: [],
    absoluteX: 0,
    absoluteY: 0,
    width: rootNode.layoutStyle?.width || 720,
    height: rootNode.layoutStyle?.height || 1560,
    createdAt: now,
    updatedAt: now,
  };
  return rootAnnotation;
};

interface ConvertOptions {
  isFirstLevel?: boolean;
  isActiveDoc?: boolean;
  documentName?: string;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  onSettingsClick?: () => void;
}

// 转换AnnotationNode为Tree DataNode
export const convertToTreeData = (node: AnnotationNode, options: ConvertOptions = {}): DataNode => {
  const { isFirstLevel = false, isActiveDoc = false, documentName, onSettingsClick } = options;
  const isRoot = node.isRoot;
  const isContainer = node.isContainer;
  const isMainPage = node.isMainPage;

  const title = (
    <Space size={4} style={{ width: '100%', justifyContent: 'space-between' }}>
      <Space size={4}>
        {isMainPage ? (
          <span role='img' aria-label='main-page-flag'>
            🚩
          </span>
        ) : null}
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
          <span style={{ fontSize: 12, color: 'rgb(82, 196, 26)' }}>{isMainPage ? '[主页面]' : '[组件]'}</span>
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
                designDetectionActions.expandAll();
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
                designDetectionActions.collapseAll();
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
                onSettingsClick?.();
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
