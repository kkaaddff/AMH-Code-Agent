/** Canvas 颜色常量定义 */
export const COLORS = {
  /** Hover DSL节点颜色 - 浅蓝色虚线外发光 */
  HOVER_DSL_NODE: 'rgb(64, 169, 255)',
  /** 已标注组件默认颜色 - 浅蓝色实线 */
  ANNOTATED_DEFAULT: 'rgb(145, 213, 255)',
  /** 已标注组件选中颜色 - 更亮的蓝色虚线 */
  ANNOTATED_SELECTED: 'rgb(24, 144, 255)',
  /** 已标注组件hover颜色 - 中等亮度蓝色虚线 */
  ANNOTATED_HOVERED: 'rgb(64, 169, 255)',
  /** 标签背景色 */
  LABEL_BACKGROUND: 'rgb(24, 144, 255)',
  /** 标签文字颜色 */
  LABEL_TEXT: 'rgb(255, 255, 255)',
  /** 选中标签背景色 */
  LABEL_BACKGROUND_SELECTED: 'rgb(24, 120, 255)',
  /** 容器边框颜色 */
  CONTAINER_BORDER: 'rgb(217, 217, 217)',
  /** 容器背景色 */
  CONTAINER_BACKGROUND: 'rgb(245, 245, 245)',
  /** 外层背景色 */
  OUTER_BACKGROUND: 'rgb(250, 250, 250)',
  /** 画布背景色 */
  CANVAS_BACKGROUND: 'rgb(255, 255, 255)',
  /** 栅格线颜色 */
  GRID_LINE: 'rgba(0, 0, 0, 0.05)',
  /** 未标注节点边框颜色 - 浅灰色虚线 */
  UNANNOTATED_BORDER: 'rgb(105, 192, 255)',
  /** DSL面板边界颜色 */
  DSL_BOUNDARY: 'rgb(179, 127, 235)',
} as const;

/** Canvas 绘制样式常量定义 */
export const DRAW_STYLES = {
  /** 未标注节点边框线宽 */
  UNANNOTATED_BORDER_WIDTH: 1,
  /** Hover DSL节点线宽 */
  HOVER_DSL_NODE_WIDTH: 2,
  /** 选中DSL节点线宽 */
  SELECTED_DSL_NODE_WIDTH: 4,
  /** 已标注组件默认线宽 */
  ANNOTATED_DEFAULT_WIDTH: 2,
  /** 已标注组件hover线宽 */
  ANNOTATED_HOVER_WIDTH: 3,
  /** 已标注组件选中线宽 */
  ANNOTATED_SELECTED_WIDTH: 4,
  /** Hover DSL节点阴影模糊半径 */
  HOVER_DSL_NODE_SHADOW_BLUR: 10,
  /** 选中DSL节点阴影模糊半径 */
  SELECTED_DSL_NODE_SHADOW_BLUR: 12,
  /** 已标注组件hover阴影模糊半径 */
  ANNOTATED_HOVER_SHADOW_BLUR: 8,
} as const;

/** Canvas 虚线样式常量定义 */
export const DASH_PATTERNS: { [key: string]: [number, number] } = {
  /** 未标注节点虚线样式 */
  UNANNOTATED_DASH: [4, 4],
  /** Hover DSL节点虚线样式 */
  HOVER_DSL_NODE_DASH: [5, 5],
  /** 选中DSL节点虚线样式 */
  SELECTED_DSL_NODE_DASH: [8, 4],
  /** 已标注组件hover虚线样式 */
  ANNOTATED_HOVER_DASH: [8, 4],
};

/** Canvas 背景栅格配置 */
export const GRID_CONFIG = {
  /** 栅格间距 */
  SIZE: 24,
  /** 栅格线宽 */
  LINE_WIDTH: 1,
} as const;

/** Canvas 标签样式常量定义 */
export const LABEL_STYLES = {
  DEFAULT: {
    /** 标签字体 */
    FONT: '12px Inter, sans-serif',
    /** 标签内边距 */
    PADDING: 12,
    /** 标签高度 */
    HEIGHT: 20,
    /** 标签水平偏移 */
    OFFSET_X: 8,
    /** 标签垂直偏移 */
    OFFSET_Y: 8,
    /** 标签文字水平偏移 */
    TEXT_OFFSET_X: 6,
  },
  SELECTED: {
    /** 选中标签字体 */
    FONT: '16px Inter, sans-serif',
    /** 选中标签内边距 */
    PADDING: 16,
    /** 选中标签高度 */
    HEIGHT: 26,
    /** 选中标签水平偏移 */
    OFFSET_X: 10,
    /** 选中标签垂直偏移 */
    OFFSET_Y: 6,
    /** 选中标签文字水平偏移 */
    TEXT_OFFSET_X: 8,
  },
} as const;
/** Canvas 缩放常量定义 */

export const SCALE_CONFIG = {
  /** 最小缩放比例 */
  MIN_SCALE: 0.1,
  /** 最大缩放比例 */
  MAX_SCALE: 1,
  /** 滚轮缩放步长 */
  WHEEL_SCALE_STEP: 0.05,
} as const;
