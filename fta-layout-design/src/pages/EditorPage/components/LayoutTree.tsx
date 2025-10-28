import React, { useEffect, useRef, useMemo, useState } from "react";
import { Tree, Button, Space } from "antd";
import { ExpandAltOutlined, ShrinkOutlined } from "@ant-design/icons";
import type { DataNode } from "antd/es/tree";
import { LayoutTreeNode } from "@/types/layout";
import { generateNodeKey } from "@/utils/nodeUtils";

interface LayoutTreeProps {
  data: LayoutTreeNode;
  selectedKeys?: string[];
  onSelect?: (selectedKeys: string[], node: any) => void;
  onHover?: (nodeId: string | null) => void;
}

const TreeNodeTitle = ({
  componentName,
  isSelected,
  nodeKey,
  node,
  onHover,
  level = 0,
}: {
  componentName: string;
  isSelected: boolean;
  nodeKey: string;
  node: LayoutTreeNode;
  onHover?: (nodeId: string | null) => void;
  level?: number;
}) => {
  const handleMouseEnter = () => onHover?.(nodeKey);
  const handleMouseLeave = () => onHover?.(null);

  const displayInfo = node.comment || node.props?.content || null;

  return (
    <div
      style={{
        padding: "4px 8px",
        borderRadius: "4px",
        background: isSelected ? "rgb(24, 144, 255)" : "rgba(0, 0, 0, 0)",
        color: isSelected ? "rgb(255, 255, 255)" : "rgb(51, 51, 51)",
        fontWeight: isSelected ? 600 : 500,
        maxWidth: `${Math.max(100, 300 - level * 80)}px`,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {componentName}
      {displayInfo && (
        <span style={{ fontSize: "12px", color: isSelected ? "rgba(255,255,255,0.8)" : "rgb(153, 153, 153)", marginLeft: "8px" }}>
          {displayInfo}
        </span>
      )}
    </div>
  );
};

const LayoutTree: React.FC<LayoutTreeProps> = ({
  data,
  selectedKeys = [],
  onSelect,
  onHover,
}) => {
  const treeContainerRef = useRef<HTMLDivElement>(null);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    expandAll();
  }, []);

  useEffect(() => {
    const currentSelectedKey = selectedKeys[0] || "";
    if (currentSelectedKey && treeContainerRef.current) {
      const selectedElement = treeContainerRef.current.querySelector('.ant-tree-node-selected');
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }
    }
  }, [selectedKeys]);

  const getAllNodeKeys = (node: LayoutTreeNode, index = 0, parentPath = ""): string[] => {
    const nodeKey = generateNodeKey(node, index, parentPath);
    const childKeys = node.children?.flatMap((child, childIndex) =>
      getAllNodeKeys(child, childIndex, nodeKey)
    ) || [];
    return [nodeKey, ...childKeys];
  };

  const expandAll = () => {
    const allKeys = getAllNodeKeys(data);
    setExpandedKeys(allKeys);
  };

  const collapseAll = () => {
    setExpandedKeys([]);
  };

  const treeData = useMemo(() => {
    const convertToTreeData = (
      node: LayoutTreeNode,
      index = 0,
      parentPath = "",
      level = 0
    ): DataNode => {
      const { componentName, children = [] } = node;
      const nodeKey = generateNodeKey(node, index, parentPath);
      const isSelected = selectedKeys.includes(nodeKey);

      return {
        key: nodeKey,
        title: (
          <TreeNodeTitle
            componentName={componentName}
            isSelected={isSelected}
            nodeKey={nodeKey}
            node={node}
            onHover={onHover}
            level={level}
          />
        ),
        children: children.map((child, childIndex) =>
          convertToTreeData(child, childIndex, nodeKey, level + 1)
        ),
      };
    };

    return [convertToTreeData(data)];
  }, [data, selectedKeys, onHover]);

  const handleSelect = (selectedKeys: React.Key[], info: any) => {
    onSelect?.(selectedKeys as string[], info);
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid rgb(240, 240, 240)",
          backgroundColor: "rgb(250, 250, 250)",
        }}
      >
        <Space size="small">
          <Button type="text" size="small" icon={<ExpandAltOutlined />} onClick={expandAll}>
            展开全部
          </Button>
          <Button type="text" size="small" icon={<ShrinkOutlined />} onClick={collapseAll}>
            折叠全部
          </Button>
        </Space>
      </div>

      <div ref={treeContainerRef} style={{ flex: 1, overflow: "auto" }}>
        <Tree
          treeData={treeData}
          selectedKeys={selectedKeys}
          expandedKeys={expandedKeys}
          onSelect={handleSelect}
          onExpand={setExpandedKeys}
          showLine
          showIcon={false}
          style={{
            backgroundColor: "rgb(250, 250, 250)",
            padding: "8px",
          }}
        />
      </div>
    </div>
  );
};

export default LayoutTree;
