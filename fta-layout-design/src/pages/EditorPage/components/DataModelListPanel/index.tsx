import { dataModelService } from '@/services/dataModelService';
import type { DataModel } from '@/types/dataModel';
import { DatabaseOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { App, Button, Empty, Input, List, Popconfirm, Space, Spin, Tag, Typography } from 'antd';
import React, { useMemo, useState } from 'react';
import { useSnapshot } from 'valtio';
import { editorPageActions, editorPageStore } from '../../contexts/EditorPageContext';
import './index.css';

const { Title, Text } = Typography;

interface DataModelListPanelProps {
  onCreateClick?: () => void;
  onItemClick?: (model: DataModel) => void;
}

const DataModelListPanel: React.FC<DataModelListPanelProps> = ({ onCreateClick, onItemClick }) => {
  const { message } = App.useApp();
  const { dataModels, dataModelGroups, loadingDataView, selectedDataModelId, selectedGroupId } =
    useSnapshot(editorPageStore);

  const [searchText, setSearchText] = useState('');

  // 根据选中的分组和搜索条件过滤数据模型
  const filteredDataModels = useMemo(() => {
    let models = dataModels as DataModel[];

    // 按分组筛选
    if (selectedGroupId === '__ungrouped__') {
      models = models.filter((m) => !m.groupId);
    } else if (selectedGroupId) {
      models = models.filter((m) => m.groupId === selectedGroupId);
    }

    // 按搜索条件筛选
    if (searchText.trim()) {
      const lowerSearch = searchText.toLowerCase();
      models = models.filter(
        (m) =>
          m.name.toLowerCase().includes(lowerSearch) ||
          (m.description?.toLowerCase().includes(lowerSearch) ?? false)
      );
    }

    return models;
  }, [dataModels, selectedGroupId, searchText]);

  // 获取分组名称
  const getGroupName = (groupId?: string) => {
    if (!groupId) return '未分组';
    const group = dataModelGroups.find((g) => g.id === groupId);
    return group?.name || '未知分组';
  };

  // 处理删除
  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await dataModelService.delete(id);
      editorPageActions.removeDataModel(id);
      message.success('数据模型已删除');
    } catch (error: any) {
      console.error('删除数据模型失败:', error);
      message.error(error.message || '删除失败');
    }
  };

  // 处理选中
  const handleSelect = (model: DataModel) => {
    editorPageActions.setSelectedDataModelId(model.id);
    onItemClick?.(model);
  };

  return (
    <div className='data-model-list-panel'>
      {/* Header */}
      <div className='data-model-list-panel__header'>
        <div className='data-model-list-panel__header-top'>
          <Title level={5} className='data-model-list-panel__title'>
            <DatabaseOutlined /> 数据模型
          </Title>
          <Button type='primary' size='small' icon={<PlusOutlined />} onClick={onCreateClick}>
            新建
          </Button>
        </div>
        <Input
          placeholder='搜索数据模型名称或描述...'
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          className='data-model-list-panel__search'
        />
      </div>

      {/* List */}
      <div className='data-model-list-panel__content'>
        <Spin spinning={loadingDataView}>
          {filteredDataModels.length === 0 ? (
            <Empty
              description={dataModels.length === 0 ? '暂无数据模型，点击上方按钮新建' : '没有匹配的数据模型'}
              className='data-model-list-panel__empty'
            />
          ) : (
            <List
              dataSource={filteredDataModels}
              renderItem={(model) => {
                const isSelected = selectedDataModelId === model.id;
                return (
                  <List.Item
                    key={model.id}
                    className={`data-model-list-panel__item${isSelected ? ' data-model-list-panel__item--selected' : ''}`}
                    onClick={() => handleSelect(model)}>
                    <List.Item.Meta
                      title={
                        <Space className='data-model-list-panel__item-title'>
                          <Text strong>{model.name}</Text>
                          <Tag color='purple' className='data-model-list-panel__tag'>
                            {getGroupName(model.groupId)}
                          </Tag>
                        </Space>
                      }
                      description={
                        model.description && (
                          <Text type='secondary' className='data-model-list-panel__desc' ellipsis>
                            {model.description}
                          </Text>
                        )
                      }
                    />
                    <Popconfirm
                      title='确定删除此数据模型？'
                      onConfirm={(e) => handleDelete(model.id, e as any)}
                      onCancel={(e) => e?.stopPropagation()}
                      okText='删除'
                      cancelText='取消'>
                      <Button
                        type='text'
                        size='small'
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>
                  </List.Item>
                );
              }}
            />
          )}
        </Spin>
      </div>

      {/* Footer */}
      <div className='data-model-list-panel__footer'>
        <Text type='secondary'>
          共 {filteredDataModels.length} 个数据模型
          {selectedGroupId && selectedGroupId !== '__ungrouped__' && ` (已筛选)`}
        </Text>
      </div>
    </div>
  );
};

export default DataModelListPanel;

