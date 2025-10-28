import React from 'react';
import {
  DSLNode,
  DSLTextNode,
  DSLLayerNode,
  DSLPathNode,
  DSLFrameNode,
  DSLInstanceNode,
  DSLData,
  DSLStyles,
} from '../types/dsl';
import {
  parseColor,
  parseLayoutStyle,
  parseFlexContainerStyle,
  parseBorderRadius,
  parseTextStyle,
} from '../utils/styleUtils';
import { parseImageUrl } from '../utils/imageUtils';
import { parseBorderStyle, parseEffectStyle } from '../utils/layoutUtils';

interface DSLElementProps {
  node?: DSLNode;
  dslData?: DSLData | null;
  onSelect?: (nodeId: string | null) => void;
  onHover?: (nodeId: string | null) => void;
  selectedNodeId?: string | null;
  hoveredNodeId?: string | null;
}

const SELECTION_STYLES = {
  selected: {
    outline: '2px solid #d46b08',
    outlineOffset: '1px',
  },
  hovered: {
    outline: '2px dashed #ffa940',
    outlineOffset: '1px',
  },
};

const DSLElement: React.FC<DSLElementProps> = ({ node, dslData, onSelect, onHover, selectedNodeId, hoveredNodeId }) => {
  const currentNode = node || dslData?.dsl.nodes[0];
  const styles: DSLStyles = dslData?.dsl.styles ?? {};

  if (!currentNode) {
    return <div>Empty DSL</div>;
  }

  if (currentNode.hidden) {
    return null;
  }

  const isSelected = selectedNodeId === currentNode.id;
  const isHovered = hoveredNodeId === currentNode.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(currentNode.id);
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    e.stopPropagation();
    onHover?.(currentNode.id);
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onHover?.(null);
  };

  const combinedStyle: React.CSSProperties = {
    ...parseLayoutStyle(currentNode.layoutStyle),
    backgroundColor:
      'fill' in currentNode && currentNode.fill ? parseColor(currentNode.fill as string, styles) : 'rgba(0, 0, 0, 0)',
    ...('borderRadius' in currentNode && currentNode.borderRadius
      ? parseBorderRadius(currentNode.borderRadius as string)
      : {}),
    ...('strokeColor' in currentNode && currentNode.strokeColor
      ? parseBorderStyle(
          currentNode.strokeColor as string,
          (currentNode as any).strokeType as string,
          (currentNode as any).strokeAlign as string,
          (currentNode as any).strokeWidth as string,
          styles
        )
      : {}),
    ...('effect' in currentNode && currentNode.effect ? parseEffectStyle(currentNode.effect as string, styles) : {}),
    ...('opacity' in currentNode && currentNode.opacity !== undefined ? { opacity: currentNode.opacity } : {}),
    ...('flexContainerInfo' in currentNode && currentNode.flexContainerInfo
      ? parseFlexContainerStyle(currentNode.flexContainerInfo)
      : {}),
    ...('flexGrow' in currentNode && currentNode.flexGrow !== undefined && currentNode.flexGrow !== null
      ? { flexGrow: Number(currentNode.flexGrow) }
      : {}),
    ...('flexShrink' in currentNode && currentNode.flexShrink !== undefined && currentNode.flexShrink !== null
      ? { flexShrink: Number(currentNode.flexShrink) }
      : {}),
    ...('overflow' in currentNode && currentNode.overflow
      ? { overflow: currentNode.overflow as React.CSSProperties['overflow'] }
      : {}),
    ...(isSelected ? SELECTION_STYLES.selected : isHovered ? SELECTION_STYLES.hovered : {}),
    boxSizing: 'border-box',
    cursor: onSelect ? 'pointer' : 'default',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  };

  const elementProps = {
    'data-dsl-id': currentNode.id,
    'data-dsl-type': currentNode.type,
    'data-dsl-name': currentNode.name || '',
    onClick: handleClick,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };

  const renderChildren = (children?: DSLNode[]) => {
    if (!children || children.length === 0) return null;
    return children.map((child, index) => (
      <DSLElement
        key={`${child.id}-${index}`}
        node={child}
        dslData={dslData}
        onSelect={onSelect}
        onHover={onHover}
        selectedNodeId={selectedNodeId}
        hoveredNodeId={hoveredNodeId}
      />
    ));
  };

  switch (currentNode.type) {
    case 'TEXT': {
      const textNode = currentNode as DSLTextNode;
      const textContent = textNode.text.map((t) => t.text).join('');

      const textStyle: React.CSSProperties = {
        ...(textNode.text && textNode.text.length > 0 ? parseTextStyle(textNode.text[0].font, styles) : {}),
        ...(textNode.textColor && textNode.textColor.length > 0
          ? { color: parseColor(textNode.textColor[0].color, styles) }
          : {}),
        textAlign: textNode.textAlign,
        ...(textNode.textMode === 'single-line'
          ? {
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              // textOverflow: 'ellipsis'
            }
          : textNode.textMode === 'auto-height'
          ? { whiteSpace: 'pre-wrap' }
          : {}),
      };

      return (
        <div style={{ ...combinedStyle, ...textStyle }} {...elementProps}>
          {textContent}
        </div>
      );
    }

    case 'LAYER': {
      const layerNode = currentNode as DSLLayerNode;

      // 检查 fill 是否是字符串（paint ID）
      const fillId = layerNode.fill && typeof layerNode.fill === 'string' ? layerNode.fill : null;

      let backgroundImageStyle: React.CSSProperties = {};
      let layerSpecificStyle: React.CSSProperties = {};

      if (fillId && fillId.startsWith('paint_')) {
        const style = styles[fillId];

        // 检查是否是图像（value[0] 是对象且有 url 属性）
        if (style && Array.isArray(style.value) && style.value.length > 0) {
          const firstValue = style.value[0];
          if (typeof firstValue === 'object' && firstValue !== null && 'url' in firstValue) {
            // 这是图像
            const imageUrl = parseImageUrl(fillId, styles);
            if (imageUrl) {
              backgroundImageStyle = {
                background: `url(${imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: 'transparent',
              };
              // 如果设置背景图像，需要移除背景色（因为 combinedStyle 可能已经设置了）
              layerSpecificStyle = { backgroundColor: 'transparent' };
            }
          }
          // 如果是颜色，combinedStyle 中已经通过 parseColor 正确处理了，不需要额外设置
        }
      }

      const finalStyle: React.CSSProperties = {
        ...combinedStyle,
        ...layerSpecificStyle,
        ...backgroundImageStyle,
      };

      // backgroundColor 不能使用渐变 (linear-gradient)。
      if (finalStyle.backgroundColor && finalStyle.backgroundColor.startsWith('linear-gradient')) {
        finalStyle.background = finalStyle.backgroundColor;
        delete finalStyle.backgroundColor;
      }
      return <div style={finalStyle} {...elementProps} />;
    }

    case 'PATH': {
      const pathNode = currentNode as DSLPathNode;

      if (!pathNode.path || pathNode.path.length === 0) {
        return <div style={combinedStyle} {...elementProps} />;
      }

      const pathData = pathNode.path[0];
      const fillColor = pathData.fill ? parseColor(pathData.fill, styles) : 'rgb(0, 0, 0)';
      const width = pathNode.layoutStyle?.width || 100;
      const height = pathNode.layoutStyle?.height || 100;

      return (
        <div
          style={{
            width: `${width}px`,
            height: `${height}px`,
            position: 'relative',
            ...parseLayoutStyle(pathNode.layoutStyle),
          }}
          {...elementProps}
        >
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            <path
              d={pathData.data}
              fill={fillColor}
              transform={pathNode.layoutStyle?.rotate ? `rotate(${pathNode.layoutStyle.rotate})` : undefined}
            />
          </svg>
        </div>
      );
    }

    case 'INSTANCE': {
      const instanceNode = currentNode as DSLInstanceNode;
      return (
        <div style={combinedStyle} {...elementProps}>
          {renderChildren(instanceNode.children)}
        </div>
      );
    }

    case 'FRAME': {
      const frameNode = currentNode as DSLFrameNode;
      return (
        <div style={combinedStyle} {...elementProps}>
          {renderChildren(frameNode.children)}
        </div>
      );
    }

    default: {
      return (
        <div style={combinedStyle} {...elementProps}>
          {renderChildren((currentNode as any).children)}
        </div>
      );
    }
  }
};

DSLElement.displayName = 'DSLElement';

export default DSLElement;
