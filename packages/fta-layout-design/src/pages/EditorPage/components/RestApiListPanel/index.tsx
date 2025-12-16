import { restApiService } from '@/services/restApiService';
import type { RestApi, RestApiGroup } from '@/types/restApi';
import { METHOD_COLORS } from '@/types/restApi';
import { ApiOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { App, Button, Empty, Input, List, Popconfirm, Space, Spin, Tag, Typography } from 'antd';
import React, { useMemo, useState } from 'react';
import { useSnapshot } from 'valtio';
import { editorPageActions, editorPageStore } from '../../contexts/EditorPageContext';
import './index.css';

const { Title, Text } = Typography;

interface RestApiListPanelProps {
  onCreateClick?: () => void;
  onItemClick?: (api: RestApi) => void;
}

const RestApiListPanel: React.FC<RestApiListPanelProps> = ({ onCreateClick, onItemClick }) => {
  const { message } = App.useApp();
  const { restApis, restApiGroups, loadingDataView, selectedRestApiId, selectedRestApiGroupId } =
    useSnapshot(editorPageStore);

  const [searchText, setSearchText] = useState('');

  // 获取当前组名称
  const currentGroupName = useMemo(() => {
    if (!selectedRestApiGroupId) return '全部';
    if (selectedRestApiGroupId === '__ungrouped__') return '未分组';
    const group = (restApiGroups as RestApiGroup[]).find((g) => g.id === selectedRestApiGroupId);
    return group?.name || '未知组';
  }, [selectedRestApiGroupId, restApiGroups]);

  // 根据搜索条件和组筛选过滤接口
  const filteredRestApis = useMemo(() => {
    let result = restApis as RestApi[];

    // 按组筛选
    if (selectedRestApiGroupId === '__ungrouped__') {
      result = result.filter((api) => !api.groupId);
    } else if (selectedRestApiGroupId) {
      result = result.filter((api) => api.groupId === selectedRestApiGroupId);
    }

    // 按搜索文本筛选
    if (searchText.trim()) {
      const lowerSearch = searchText.toLowerCase();
      result = result.filter(
        (api) =>
          api.name.toLowerCase().includes(lowerSearch) ||
          (api.description?.toLowerCase().includes(lowerSearch) ?? false) ||
          (api.url?.toLowerCase().includes(lowerSearch) ?? false)
      );
    }

    return result;
  }, [restApis, searchText, selectedRestApiGroupId]);

  // 处理删除
  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await restApiService.delete(id);
      editorPageActions.removeRestApi(id);
      message.success('接口已删除');
    } catch (error: any) {
      console.error('删除接口失败:', error);
      message.error(error.message || '删除失败');
    }
  };

  // 处理选中
  const handleSelect = (api: RestApi) => {
    editorPageActions.setSelectedRestApiId(api.id);
    onItemClick?.(api);
  };

  return (
    <div className='rest-api-list-panel'>
      {/* Header */}
      <div className='rest-api-list-panel__header'>
        <div className='rest-api-list-panel__header-top'>
          <Title level={5} className='rest-api-list-panel__title'>
            <ApiOutlined /> 接口列表
          </Title>
          <Button type='primary' size='small' icon={<PlusOutlined />} onClick={onCreateClick}>
            新建
          </Button>
        </div>
        <Input
          placeholder='搜索接口名称、描述或 URL...'
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          className='rest-api-list-panel__search'
        />
      </div>

      {/* List */}
      <div className='rest-api-list-panel__content'>
        <Spin spinning={loadingDataView}>
          {filteredRestApis.length === 0 ? (
            <Empty
              description={restApis.length === 0 ? '暂无接口，点击上方按钮新建' : '没有匹配的接口'}
              className='rest-api-list-panel__empty'
            />
          ) : (
            <List
              dataSource={filteredRestApis}
              renderItem={(api) => {
                const isSelected = selectedRestApiId === api.id;
                return (
                  <List.Item
                    key={api.id}
                    className={`rest-api-list-panel__item${isSelected ? ' rest-api-list-panel__item--selected' : ''}`}
                    onClick={() => handleSelect(api)}>
                    <List.Item.Meta
                      title={
                        <Space className='rest-api-list-panel__item-title'>
                          {api.method && (
                            <Tag color={METHOD_COLORS[api.method]} className='rest-api-list-panel__method-tag'>
                              {api.method}
                            </Tag>
                          )}
                          <Text strong>{api.name}</Text>
                        </Space>
                      }
                      description={
                        <div className='rest-api-list-panel__item-desc'>
                          {api.description && (
                            <Text type='secondary' className='rest-api-list-panel__desc'>
                              {api.description}
                            </Text>
                          )}
                          {api.url && (
                            <Text code className='rest-api-list-panel__url'>
                              {api.url}
                            </Text>
                          )}
                        </div>
                      }
                    />
                    <Popconfirm
                      title='确定删除此接口？'
                      onConfirm={(e) => handleDelete(api.id, e as any)}
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
      <div className='rest-api-list-panel__footer'>
        <Text type='secondary'>
          {currentGroupName}：共 {filteredRestApis.length} 个接口
          {selectedRestApiGroupId && ` (全部 ${restApis.length})`}
        </Text>
      </div>
    </div>
  );
};

export default RestApiListPanel;

