import FTAComponents from "@/demo/FTAComponents.json";
import { LayoutTreeNode } from "@/types/layout";
import { DeleteOutlined, PlusOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Divider, Form, Input, Select } from "antd";
import React, { useEffect, useState } from "react";

interface PropertyPanelProps {
  selectedNode: LayoutTreeNode | null;
  onNodeUpdate?: (nodeId: string, updates: Partial<LayoutTreeNode>) => void;
}

const CONTAINER_COMPONENTS = [
  "ActionSheet", "AnimateView", "ButtonGroup", "Card", "Collapse", "Drawer", "Dropdown", "Flex",
  "FloatingPanel", "Form", "FormItem", "FormItemBordered", "Grid", "ImageBackground", "KeyboardAvoidingView",
  "LayerProvider", "Layout", "List", "Modal", "ModalContent", "ModalHeader", "NavBar", "Overlay",
  "PullToRefresh", "SafeArea", "SafeAreaView", "ScrollHelper", "SortableList", "Steps", "SwipeAction",
  "Swiper", "SwiperCompat", "SwiperItem", "SwiperItemCompat", "TabBar", "Tabs", "Timeline", "Tooltip",
  "TooltipView", "LayoutView", "TouchableHighlight", "TouchableOpacity"
];

const ENTITY_COMPONENTS = FTAComponents.filter((comp) => !CONTAINER_COMPONENTS.includes(comp));

const PropertyPanel: React.FC<PropertyPanelProps> = ({ selectedNode, onNodeUpdate }) => {
  const [form] = Form.useForm();
  const [newPropKey, setNewPropKey] = useState("");
  const [newPropValue, setNewPropValue] = useState("");
  const [newLayoutKey, setNewLayoutKey] = useState("");
  const [newLayoutValue, setNewLayoutValue] = useState("");
  const [editingProps, setEditingProps] = useState<Record<string, any>>({});
  const [editingLayout, setEditingLayout] = useState<Record<string, any>>({});

  useEffect(() => {
    if (selectedNode) {
      form.setFieldsValue({
        componentName: selectedNode.componentName,
        comment: selectedNode.comment || "",
      });
      setEditingProps(selectedNode.props || {});
      setEditingLayout(selectedNode.layout || {});
    }
  }, [selectedNode, form]);

  if (!selectedNode) {
    return (
      <div
        style={{
          textAlign: "center",
          color: "rgb(153, 153, 153)",
          marginTop: "40px",
          fontSize: "14px",
        }}
      >
        <div>请选择一个组件</div>
        <div style={{ fontSize: "12px", marginTop: "8px" }}>点击组件树或编辑区域中的组件来编辑属性</div>
      </div>
    );
  }

  const isContainerComponent = CONTAINER_COMPONENTS.includes(selectedNode.componentName);

  const handleAddProp = () => {
    if (!newPropKey.trim()) return;

    setEditingProps(prev => ({
      ...prev,
      [newPropKey.trim()]: newPropValue.trim() || ""
    }));
    setNewPropKey("");
    setNewPropValue("");
  };

  const handleDeleteProp = (propKey: string) => {
    setEditingProps(prev => {
      const newProps = { ...prev };
      delete newProps[propKey];
      return newProps;
    });
  };

  const handlePropValueChange = (propKey: string, value: string) => {
    setEditingProps(prev => ({
      ...prev,
      [propKey]: value
    }));
  };

  const handleAddLayoutProp = () => {
    if (!newLayoutKey.trim()) return;

    setEditingLayout(prev => ({
      ...prev,
      [newLayoutKey.trim()]: newLayoutValue.trim() || ""
    }));
    setNewLayoutKey("");
    setNewLayoutValue("");
  };

  const handleDeleteLayoutProp = (propKey: string) => {
    setEditingLayout(prev => {
      const newLayout = { ...prev };
      delete newLayout[propKey];
      return newLayout;
    });
  };

  const handleLayoutValueChange = (propKey: string, value: string) => {
    setEditingLayout(prev => ({
      ...prev,
      [propKey]: value
    }));
  };

  const handleSave = () => {
    if (!onNodeUpdate || !selectedNode?.nodeId) return;

    const formValues = form.getFieldsValue();
    const updates: Partial<LayoutTreeNode> = {
      componentName: formValues.componentName,
      comment: formValues.comment,
      props: editingProps,
      layout: editingLayout
    };

    if (formValues.componentName !== selectedNode.componentName) {
      const newIsContainer = CONTAINER_COMPONENTS.includes(formValues.componentName);
      if (!newIsContainer && selectedNode.children) {
        updates.children = undefined;
      }
    }

    onNodeUpdate(selectedNode.nodeId, updates);
  };

  const hasChanges = JSON.stringify(selectedNode?.props) !== JSON.stringify(editingProps) ||
                   JSON.stringify(selectedNode?.layout) !== JSON.stringify(editingLayout) ||
                   form.getFieldsValue().componentName !== selectedNode?.componentName ||
                   form.getFieldsValue().comment !== selectedNode?.comment;

  return (
    <div style={{ padding: "0 4px" }}>
      <Form form={form} layout="vertical" size="small">
        <Form.Item label="组件类型" name="componentName">
          <Select placeholder="选择组件类型" showSearch optionFilterProp="children">
            <Select.OptGroup label="容器组件">
              {CONTAINER_COMPONENTS.map((comp) => (
                <Select.Option key={comp} value={comp}>{comp}</Select.Option>
              ))}
            </Select.OptGroup>
            <Select.OptGroup label="实体组件">
              {ENTITY_COMPONENTS.map((comp) => (
                <Select.Option key={comp} value={comp}>{comp}</Select.Option>
              ))}
            </Select.OptGroup>
          </Select>
        </Form.Item>

        <Form.Item label="组件说明" name="comment">
          <Input.TextArea placeholder="请输入组件说明" rows={2} maxLength={200} />
        </Form.Item>
      </Form>

      <Divider style={{ margin: "12px 0" }} />

      <div>
        <h5 style={{ margin: "0 0 8px 0" }}>
          组件属性 ({Object.keys(editingProps).length})
        </h5>

        {Object.keys(editingProps).length > 0 && (
          <div style={{ marginBottom: "12px" }}>
            {Object.entries(editingProps).map(([key, value]) => (
              <div key={key} style={{ marginBottom: "8px", padding: "8px", background: "rgb(250, 250, 250)", borderRadius: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <strong style={{ fontSize: "12px" }}>{key}</strong>
                  <Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteProp(key)} />
                </div>
                <Input size="small" value={String(value)} onChange={(e) => handlePropValueChange(key, e.target.value)} />
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: "8px", background: "rgb(246, 246, 246)", borderRadius: "4px" }}>
          <div style={{ marginBottom: "8px" }}>
            <Input size="small" placeholder="属性名称" value={newPropKey} onChange={(e) => setNewPropKey(e.target.value)} style={{ marginBottom: "4px" }} />
            <Input size="small" placeholder="属性值" value={newPropValue} onChange={(e) => setNewPropValue(e.target.value)} />
          </div>
          <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={handleAddProp} block>
            添加属性
          </Button>
        </div>
      </div>

      <Divider style={{ margin: "12px 0" }} />

      <div>
        <h5 style={{ margin: "0 0 8px 0" }}>
          布局属性 ({Object.keys(editingLayout).length})
        </h5>

        {Object.keys(editingLayout).length > 0 && (
          <div style={{ marginBottom: "12px" }}>
            {Object.entries(editingLayout).map(([key, value]) => (
              <div key={key} style={{ marginBottom: "8px", padding: "8px", background: "rgb(240, 248, 255)", borderRadius: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <strong style={{ fontSize: "12px", color: "rgb(24, 144, 255)" }}>{key}</strong>
                  <Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteLayoutProp(key)} />
                </div>
                <Input size="small" value={String(value)} onChange={(e) => handleLayoutValueChange(key, e.target.value)} />
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: "8px", background: "rgb(240, 248, 255)", borderRadius: "4px" }}>
          <div style={{ marginBottom: "8px" }}>
            <Input size="small" placeholder="布局属性名称" value={newLayoutKey} onChange={(e) => setNewLayoutKey(e.target.value)} style={{ marginBottom: "4px" }} />
            <Input size="small" placeholder="布局属性值" value={newLayoutValue} onChange={(e) => setNewLayoutValue(e.target.value)} />
          </div>
          <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={handleAddLayoutProp} block>
            添加布局属性
          </Button>
        </div>
      </div>

      {isContainerComponent && (
        <>
          <Divider style={{ margin: "12px 0" }} />
          <h5 style={{ margin: "0 0 8px 0" }}>子组件</h5>
          <div style={{ fontSize: "12px", color: "rgb(102, 102, 102)" }}>
            {selectedNode.children?.length || 0} 个子组件
          </div>
        </>
      )}

      {hasChanges && (
        <>
          <Divider style={{ margin: "12px 0" }} />
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} block size="small">
            保存修改
          </Button>
        </>
      )}

      <Divider style={{ margin: "12px 0" }} />
      <div style={{ fontSize: "11px", color: "rgb(153, 153, 153)" }}>
        <strong>组件ID:</strong> {selectedNode.nodeId}
      </div>
    </div>
  );
};

PropertyPanel.displayName = "PropertyPanel";

export default PropertyPanel;
