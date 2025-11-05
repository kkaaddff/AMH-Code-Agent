import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { App, Input, Modal, Radio, Spin, Typography } from 'antd';
import html2canvas from 'html2canvas';

import './AnnotationConfirmModal.css';
import { AnnotationNode } from '../types/componentDetectionV2';

type ConflictChoice = 'left' | 'right' | 'both';

const collectContainerAnnotations = (root: AnnotationNode | null): AnnotationNode[] => {
  if (!root) {
    return [];
  }

  const stack: AnnotationNode[] = [root];
  const result: AnnotationNode[] = [];
  const seen = new Set<string>();

  while (stack.length) {
    const node = stack.pop();
    if (!node || seen.has(node.id)) {
      continue;
    }
    seen.add(node.id);

    if (node.isContainer) {
      result.push(node);
    }

    node.children.forEach((child) => {
      if (child) {
        stack.push(child);
      }
    });
  }

  return result;
};

const getAnnotationRect = (annotation: AnnotationNode) => {
  const width = typeof annotation.width === 'number' ? annotation.width : annotation.dslNode?.layoutStyle?.width || 0;
  const height =
    typeof annotation.height === 'number' ? annotation.height : annotation.dslNode?.layoutStyle?.height || 0;

  return {
    left: annotation.absoluteX || 0,
    top: annotation.absoluteY || 0,
    right: (annotation.absoluteX || 0) + Math.max(width, 0),
    bottom: (annotation.absoluteY || 0) + Math.max(height, 0),
  };
};

const annotationsOverlap = (a: AnnotationNode, b: AnnotationNode) => {
  const rectA = getAnnotationRect(a);
  const rectB = getAnnotationRect(b);

  const horizontalOverlap = rectA.left < rectB.right && rectA.right > rectB.left;
  const verticalOverlap = rectA.top < rectB.bottom && rectA.bottom > rectB.top;

  return horizontalOverlap && verticalOverlap;
};

const computeAnnotationComponents = (annotations: AnnotationNode[]): AnnotationNode[][] => {
  if (!annotations.length) {
    return [];
  }

  const adjacency = new Map<string, Set<string>>();
  const idToAnnotation = new Map<string, AnnotationNode>();

  annotations.forEach((annotation) => {
    adjacency.set(annotation.id, new Set());
    idToAnnotation.set(annotation.id, annotation);
  });

  for (let i = 0; i < annotations.length; i += 1) {
    for (let j = i + 1; j < annotations.length; j += 1) {
      const first = annotations[i];
      const second = annotations[j];
      if (annotationsOverlap(first, second)) {
        adjacency.get(first.id)?.add(second.id);
        adjacency.get(second.id)?.add(first.id);
      }
    }
  }

  const components: AnnotationNode[][] = [];
  const visited = new Set<string>();
  const sorted = [...annotations].sort((a, b) => {
    if (a.absoluteY !== b.absoluteY) {
      return a.absoluteY - b.absoluteY;
    }
    if (a.absoluteX !== b.absoluteX) {
      return a.absoluteX - b.absoluteX;
    }
    return a.id.localeCompare(b.id);
  });

  sorted.forEach((annotation) => {
    if (visited.has(annotation.id)) {
      return;
    }

    const stack = [annotation.id];
    const componentIds: string[] = [];

    while (stack.length) {
      const currentId = stack.pop();
      if (!currentId || visited.has(currentId)) {
        continue;
      }
      visited.add(currentId);
      componentIds.push(currentId);

      adjacency.get(currentId)?.forEach((neighborId) => {
        if (!visited.has(neighborId)) {
          stack.push(neighborId);
        }
      });
    }

    const component = componentIds
      .map((id) => idToAnnotation.get(id))
      .filter((item): item is AnnotationNode => Boolean(item))
      .sort((a, b) => {
        if (a.absoluteY !== b.absoluteY) {
          return a.absoluteY - b.absoluteY;
        }
        if (a.absoluteX !== b.absoluteX) {
          return a.absoluteX - b.absoluteX;
        }
        return a.id.localeCompare(b.id);
      });

    if (component.length) {
      components.push(component);
    }
  });

  return components;
};

interface AnnotationPreviewItem {
  id: string;
  annotation: AnnotationNode;
  image: string | null;
  details: Record<string, unknown>;
}

interface AnnotationPreviewGroup {
  id: string;
  type: 'single' | 'conflict';
  items: AnnotationPreviewItem[];
}

interface AnnotationGroupDescriptor {
  id: string;
  type: 'single' | 'conflict';
  annotations: AnnotationNode[];
}

const splitComponentsIntoGroups = (components: AnnotationNode[][]): AnnotationGroupDescriptor[] => {
  const groups: AnnotationGroupDescriptor[] = [];

  components.forEach((component) => {
    if (component.length <= 1) {
      const node = component[0];
      if (node) {
        groups.push({
          id: `single-${node.id}`,
          type: 'single',
          annotations: [node],
        });
      }
      return;
    }

    for (let idx = 0; idx < component.length; idx += 2) {
      const first = component[idx];
      const second = component[idx + 1];

      if (first && second) {
        groups.push({
          id: `conflict-${first.id}-${second.id}`,
          type: 'conflict',
          annotations: [first, second],
        });
      } else if (first) {
        groups.push({
          id: `single-${first.id}`,
          type: 'single',
          annotations: [first],
        });
      }
    }
  });

  return groups.sort((groupA, groupB) => {
    const firstA = groupA.annotations[0];
    const firstB = groupB.annotations[0];
    if (firstA && firstB) {
      if (firstA.absoluteY !== firstB.absoluteY) {
        return firstA.absoluteY - firstB.absoluteY;
      }
      if (firstA.absoluteX !== firstB.absoluteX) {
        return firstA.absoluteX - firstB.absoluteX;
      }
      return firstA.id.localeCompare(firstB.id);
    }
    return 0;
  });
};

const buildAnnotationDetails = (annotation: AnnotationNode): Record<string, unknown> => {
  return {
    id: annotation.id,
    name: annotation.name,
    component: annotation.ftaComponent,
    comment: annotation.comment,
    isContainer: annotation.isContainer,
    position: {
      x: Math.round(annotation.absoluteX || 0),
      y: Math.round(annotation.absoluteY || 0),
    },
    size: {
      width: Math.round(annotation.width || annotation.dslNode?.layoutStyle?.width || 0),
      height: Math.round(annotation.height || annotation.dslNode?.layoutStyle?.height || 0),
    },
    layout: annotation.layout ?? annotation.dslNode?.layoutStyle ?? {},
    props: annotation.props ?? {},
    childrenCount: annotation.children.length,
    updatedAt: annotation.updatedAt,
  };
};

const captureAnnotationImage = async (annotation: AnnotationNode): Promise<string | null> => {
  const selectorId = annotation.dslNode?.id || annotation.dslNodeId;
  if (!selectorId) {
    return null;
  }

  const element = document.querySelector(`[data-dsl-id="${selectorId}"]`) as HTMLElement | null;
  if (!element) {
    return null;
  }

  const rect = element.getBoundingClientRect();
  const width = Math.round(rect.width || annotation.width || annotation.dslNode?.layoutStyle?.width || 0);
  const height = Math.round(rect.height || annotation.height || annotation.dslNode?.layoutStyle?.height || 0);

  const safeWidth = Math.max(width, 16);
  const safeHeight = Math.max(height, 16);

  try {
    const deviceScale = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    const canvas = await html2canvas(element, {
      backgroundColor: null,
      useCORS: true,
      logging: false,
      scale: deviceScale,
      width: safeWidth,
      height: safeHeight,
      scrollX: 0,
      scrollY: 0,
    });
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.warn('captureAnnotationImage failed', annotation.id, error);
    return null;
  }
};

export interface AnnotationConflictResolution {
  choice?: ConflictChoice;
  note?: string;
}

export interface AnnotationConfirmModalSubmitPayload {
  groups: AnnotationPreviewGroup[];
  conflictResolutions: Record<string, AnnotationConflictResolution>;
}

interface AnnotationConfirmModalProps {
  open: boolean;
  rootAnnotation: AnnotationNode | null;
  selectedDocumentId?: string;
  onCancel: () => void;
  onConfirm?: (payload: AnnotationConfirmModalSubmitPayload) => Promise<void> | void;
}

const AnnotationConfirmModal: React.FC<AnnotationConfirmModalProps> = ({
  open,
  rootAnnotation,
  selectedDocumentId,
  onCancel,
  onConfirm,
}) => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<AnnotationPreviewGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [resolutions, setResolutions] = useState<Record<string, AnnotationConflictResolution>>({});
  const [submitting, setSubmitting] = useState(false);

  const preparePreview = useCallback(async () => {
    if (!rootAnnotation) {
      setError('当前没有可确认的标注数据');
      setLoading(false);
      return;
    }

    const containerAnnotations = collectContainerAnnotations(rootAnnotation);
    if (!containerAnnotations.length) {
      setError('未找到容器组件的标注结果，请先完成容器标注。');
      setLoading(false);
      return;
    }

    const components = computeAnnotationComponents(containerAnnotations);
    const descriptors = splitComponentsIntoGroups(components);

    if (!descriptors.length) {
      setError('没有可供确认的容器节点，请检查标注结果。');
      setLoading(false);
      return;
    }

    const captureTargets = new Map<string, AnnotationNode>();
    descriptors.forEach((descriptor) => {
      descriptor.annotations.forEach((annotation) => {
        if (!captureTargets.has(annotation.id)) {
          captureTargets.set(annotation.id, annotation);
        }
      });
    });

    const imageMap: Record<string, string | null> = {};
    for (const annotation of captureTargets.values()) {
      // eslint-disable-next-line no-await-in-loop
      imageMap[annotation.id] = await captureAnnotationImage(annotation);
    }

    const previewGroups = descriptors.map<AnnotationPreviewGroup>((descriptor) => ({
      id: descriptor.id,
      type: descriptor.type,
      items: descriptor.annotations.map((annotation) => ({
        id: annotation.id,
        annotation,
        image: imageMap[annotation.id] ?? null,
        details: buildAnnotationDetails(annotation),
      })),
    }));

    setGroups(previewGroups);

    const initialResolutions: Record<string, AnnotationConflictResolution> = {};
    previewGroups
      .filter((group) => group.type === 'conflict')
      .forEach((group) => {
        initialResolutions[group.id] = { choice: undefined, note: '' };
      });
    setResolutions(initialResolutions);
    setLoading(false);
  }, [rootAnnotation]);

  useEffect(() => {
    if (!open) {
      setLoading(false);
      setError(null);
      setGroups([]);
      setResolutions({});
      setSubmitting(false);
      return;
    }

    if (!selectedDocumentId) {
      message.error('请提供设计稿 ID 参数');
      onCancel();
      return;
    }

    if (!rootAnnotation) {
      message.error('当前没有可确认的标注数据');
      onCancel();
      return;
    }

    setLoading(true);
    setError(null);
    setGroups([]);
    setResolutions({});

    preparePreview().catch((prepError) => {
      console.error('AnnotationConfirmModal prepare failed:', prepError);
      setError(prepError instanceof Error ? prepError.message : '标注确认初始化失败');
      setLoading(false);
      message.error('标注确认初始化失败，请稍后重试');
    });
  }, [open, selectedDocumentId, rootAnnotation, message, onCancel, preparePreview]);

  const hasUnresolvedConflicts = useMemo(() => {
    return groups.some((group) => {
      if (group.type !== 'conflict') {
        return false;
      }
      const resolution = resolutions[group.id];
      if (!resolution || !resolution.choice) {
        return true;
      }
      if (resolution.choice === 'both' && !resolution.note?.trim()) {
        return true;
      }
      return false;
    });
  }, [groups, resolutions]);

  const isConfirmDisabled = loading || hasUnresolvedConflicts;

  const handleConflictChoiceChange = useCallback((groupId: string, choice: ConflictChoice) => {
    setResolutions((prev) => ({
      ...prev,
      [groupId]: {
        choice,
        note: choice === 'both' ? prev[groupId]?.note || '' : undefined,
      },
    }));
  }, []);

  const handleConflictNoteChange = useCallback((groupId: string, note: string) => {
    setResolutions((prev) => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        note,
      },
    }));
  }, []);

  const handleCancel = useCallback(() => {
    if (submitting) {
      return;
    }
    onCancel();
  }, [onCancel, submitting]);

  const handleSubmit = useCallback(async () => {
    if (loading || submitting) {
      return;
    }

    for (const group of groups) {
      if (group.type !== 'conflict') {
        continue;
      }
      const resolution = resolutions[group.id];
      if (!resolution || !resolution.choice) {
        message.warning('请先处理所有容器冲突后再继续生成代码');
        return;
      }
      if (resolution.choice === 'both' && !resolution.note?.trim()) {
        message.warning('请选择在“都保留”时的展示条件备注');
        return;
      }
    }

    setSubmitting(true);
    try {
      console.table(
        Object.entries(resolutions).map(([groupId, resolution]) => ({
          groupId,
          choice: resolution?.choice || '未设置',
          note: resolution?.note || '',
        }))
      );

      if (onConfirm) {
        await onConfirm({ groups, conflictResolutions: resolutions });
      }

      onCancel();
    } catch (submitError) {
      console.error('继续生成代码失败', submitError);
      message.error('继续生成代码失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  }, [groups, loading, message, onCancel, onConfirm, resolutions, submitting]);

  const renderAnnotationScreenshot = useCallback((item: AnnotationPreviewItem) => {
    return (
      <div className='annotation-confirm-screenshot'>
        {item.image ? (
          <img className='annotation-confirm-screenshot-image' src={item.image} alt={`annotation-${item.id}`} />
        ) : (
          <div className='annotation-confirm-placeholder'>未获取到截图</div>
        )}
      </div>
    );
  }, []);

  const renderAnnotationJson = useCallback((item: AnnotationPreviewItem) => {
    return (
      <div className='annotation-confirm-json'>
        <pre className='annotation-confirm-json-content'>{JSON.stringify(item.details, null, 2)}</pre>
      </div>
    );
  }, []);

  return (
    <Modal
      title='确认标注结果'
      open={open}
      width={960}
      centered
      maskClosable={!loading && !submitting}
      destroyOnClose={false}
      onCancel={handleCancel}
      onOk={handleSubmit}
      okText='继续生成代码'
      cancelText='返回调整'
      okButtonProps={{ loading: submitting, disabled: isConfirmDisabled }}
      cancelButtonProps={{ disabled: loading || submitting }}
      className='annotation-confirm-modal'>
      {loading ? (
        <div className='annotation-confirm-loading'>
          <Spin size='large' tip='正在准备标注确认视图...' />
        </div>
      ) : (
        <div className='annotation-confirm-list'>
          {error && <Typography.Text type='danger'>{error}</Typography.Text>}
          {!error && !groups.length && <Typography.Text type='secondary'>暂无容器标注数据</Typography.Text>}
          {!error &&
            groups.map((group) => {
              const isConflict = group.type === 'conflict';
              const resolution = resolutions[group.id];
              return (
                <div key={group.id} className='annotation-confirm-group'>
                  <Typography.Text strong className='annotation-confirm-group-title'>
                    {isConflict ? '容器冲突待确认' : '容器标注'}
                  </Typography.Text>
                  {isConflict ? (
                    <div className='annotation-confirm-conflict-container'>
                      <div className='annotation-confirm-conflict-controls'>
                        <Typography.Text>检测到相同位置存在多个容器，请选择保留策略：</Typography.Text>
                        <Radio.Group
                          value={resolution?.choice}
                          onChange={(event) => handleConflictChoiceChange(group.id, event.target.value)}>
                          <Radio value='left'>采用左侧</Radio>
                          <Radio value='right'>采用右侧</Radio>
                          <Radio value='both'>都保留</Radio>
                        </Radio.Group>
                        {resolution?.choice === 'both' && (
                          <Input.TextArea
                            rows={2}
                            placeholder='说明在什么场景展示左侧或右侧方案'
                            value={resolution?.note || ''}
                            onChange={(event) => handleConflictNoteChange(group.id, event.target.value)}
                            className='annotation-confirm-note-input'
                          />
                        )}
                      </div>
                      <div className='annotation-confirm-conflict-grid'>
                        {group.items.map((item, index) => (
                          <div key={item.id} className='annotation-confirm-conflict-item'>
                            <Typography.Text type='secondary'>
                              {index === 0 ? '左侧方案' : index === 1 ? '右侧方案' : `方案 ${index + 1}`}
                            </Typography.Text>
                            <div>{renderAnnotationScreenshot(item)}</div>
                            <div>{renderAnnotationJson(item)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    group.items.map((item) => (
                      <div key={item.id} className='annotation-confirm-item'>
                        {renderAnnotationScreenshot(item)}
                        {renderAnnotationJson(item)}
                      </div>
                    ))
                  )}
                </div>
              );
            })}
        </div>
      )}
    </Modal>
  );
};

export default AnnotationConfirmModal;
